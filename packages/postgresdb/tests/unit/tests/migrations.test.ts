import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { QueryTypes, Sequelize } from 'sequelize';

import {
  createMigrationRunner,
  defineMigration,
  parseArgv,
  runMigrationsCli,
} from '../../models/dist';

jest.setTimeout(120000);

let postgresContainer: StartedPostgreSqlContainer;
let verify: Sequelize;

const rows = async <T>(sql: string): Promise<T[]> => {
  return verify.query<T>(sql, { type: QueryTypes.SELECT }) as Promise<T[]>;
};

const ledgerRows = async () => {
  return rows<{
    name: string;
    version: string | null;
    args: Record<string, unknown> | null;
    baseline: boolean;
  }>(
    'SELECT name, version, args, baseline FROM schema_migrations ORDER BY applied_at, name'
  );
};

const quiet = () => {
  return undefined;
};

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.1-pg18-trixie'
  ).start();

  // The runner opens its own client from these, the same way `initialize` does.
  process.env.DATABASE_HOST = postgresContainer.getHost();
  process.env.DATABASE_PORT = String(postgresContainer.getPort());
  process.env.DATABASE_USER = postgresContainer.getUsername();
  process.env.DATABASE_PASSWORD = postgresContainer.getPassword();
  process.env.DATABASE_NAME = postgresContainer.getDatabase();

  verify = new Sequelize({
    dialect: 'postgres',
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    logging: false,
  });
});

afterAll(async () => {
  await verify.close();
  await postgresContainer.stop();
});

beforeEach(async () => {
  await verify.query('DROP TABLE IF EXISTS schema_migrations');
  await verify.query('DROP TABLE IF EXISTS widgets');
  await verify.query(
    'CREATE TABLE widgets (id SERIAL PRIMARY KEY, label TEXT)'
  );
  await verify.query(`INSERT INTO widgets (label) VALUES ('a'), ('b')`);
});

describe('createMigrationRunner', () => {
  test('applies pending migrations in declaration order and records each one', async () => {
    const order: string[] = [];

    const runner = createMigrationRunner({
      version: 'v1.2.3',
      log: quiet,
      migrations: [
        defineMigration({
          name: 'add-color',
          up: async (ctx) => {
            order.push('add-color');
            await ctx.addColumnIfMissing({
              table: 'widgets',
              column: 'color',
              type: 'VARCHAR(16)',
            });
          },
        }),
        defineMigration({
          name: 'paint-widgets',
          options: [
            { flag: 'color', description: 'the color', required: true },
          ],
          up: async (ctx) => {
            order.push('paint-widgets');
            await ctx.run({
              sql: 'UPDATE widgets SET color = $1 WHERE color IS NULL',
              values: [ctx.args.color],
            });
            await ctx.setNotNull({ table: 'widgets', column: 'color' });
          },
        }),
      ],
    });

    try {
      const first = await runner.run({ args: { color: 'teal' } });

      expect(first).toEqual({
        applied: ['add-color', 'paint-widgets'],
        skipped: [],
      });
      expect(order).toEqual(['add-color', 'paint-widgets']);

      const painted = await rows<{ color: string }>(
        'SELECT color FROM widgets'
      );
      expect(
        painted.map((row) => {
          return row.color;
        })
      ).toEqual(['teal', 'teal']);

      const ledger = await ledgerRows();
      expect(ledger).toEqual([
        // Only what a migration declares is recorded with it.
        {
          name: 'add-color',
          version: 'v1.2.3',
          args: null,
          baseline: false,
        },
        {
          name: 'paint-widgets',
          version: 'v1.2.3',
          args: { color: 'teal' },
          baseline: false,
        },
      ]);

      // A second run finds everything in the ledger and runs nothing.
      const second = await runner.run({ args: { color: 'red' } });

      expect(second).toEqual({
        applied: [],
        skipped: ['add-color', 'paint-widgets'],
      });
      expect(order).toHaveLength(2);

      const status = await runner.status();
      expect(status.unknown).toEqual([]);
      expect(
        status.migrations.map((entry) => {
          return [entry.name, entry.applied !== null];
        })
      ).toEqual([
        ['add-color', true],
        ['paint-widgets', true],
      ]);
    } finally {
      await runner.close();
    }
  });

  test('a dry run reads, reports, and writes nothing — not even the ledger', async () => {
    const said: string[] = [];
    const sync = jest.fn(async () => {
      return undefined;
    });

    const runner = createMigrationRunner({
      sync,
      log: (message) => {
        said.push(message);
      },
      migrations: [
        defineMigration({
          name: 'add-color',
          up: async (ctx) => {
            const before = await ctx.countOf({
              sql: 'SELECT count(*)::text AS count FROM widgets',
            });
            ctx.say(`${before} widget(s) would gain a color`);
            await ctx.addColumnIfMissing({
              table: 'widgets',
              column: 'color',
              type: 'TEXT',
            });
            await ctx.sync();
            await ctx.dropColumnIfExists({ table: 'widgets', column: 'label' });
          },
        }),
      ],
    });

    try {
      const result = await runner.run({ dryRun: true });

      expect(result.applied).toEqual(['add-color']);
      expect(sync).not.toHaveBeenCalled();
      expect(said).toEqual(
        expect.arrayContaining([
          'dry-run add-color: 2 widget(s) would gain a color',
          'dry-run add-color: would run the schema sync',
          expect.stringContaining('would run ALTER TABLE "widgets" ADD COLUMN'),
          expect.stringContaining(
            'would run ALTER TABLE "widgets" DROP COLUMN'
          ),
        ])
      );

      const columns = await rows<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'widgets' ORDER BY column_name`
      );
      expect(
        columns.map((row) => {
          return row.column_name;
        })
      ).toEqual(['id', 'label']);
      expect(await ledgerRows()).toEqual([]);

      const status = await runner.status();
      expect(status.migrations[0].applied).toBeNull();
    } finally {
      await runner.close();
    }
  });

  test('a migration that throws leaves no row, and the next run retries it', async () => {
    let attempts = 0;

    const runner = createMigrationRunner({
      log: quiet,
      migrations: [
        defineMigration({
          name: 'flaky',
          up: async (ctx) => {
            attempts += 1;
            if (attempts === 1) {
              throw new Error('lost the connection');
            }
            await ctx.run({ sql: `UPDATE widgets SET label = 'ok'` });
          },
        }),
        defineMigration({
          name: 'after-flaky',
          up: async () => {
            return undefined;
          },
        }),
      ],
    });

    try {
      await expect(runner.run()).rejects.toThrow('lost the connection');
      expect(await ledgerRows()).toEqual([]);

      const retry = await runner.run();

      expect(retry.applied).toEqual(['flaky', 'after-flaky']);
      expect(attempts).toBe(2);
      expect(
        (await ledgerRows()).map((row) => {
          return row.name;
        })
      ).toEqual(['flaky', 'after-flaky']);
    } finally {
      await runner.close();
    }
  });

  test('baseline records migrations without running them', async () => {
    const up = jest.fn(async () => {
      return undefined;
    });

    const runner = createMigrationRunner({
      log: quiet,
      migrations: [
        defineMigration({ name: 'one', up }),
        defineMigration({ name: 'two', up }),
        defineMigration({ name: 'three', up }),
      ],
    });

    try {
      await expect(runner.baseline()).rejects.toThrow(/names/);

      expect(await runner.baseline({ names: ['one', 'two'] })).toEqual([
        'one',
        'two',
      ]);
      // Idempotent: what is already there is left alone.
      expect(await runner.baseline({ all: true })).toEqual(['three']);
      expect(await runner.baseline({ all: true })).toEqual([]);

      expect(up).not.toHaveBeenCalled();
      expect(
        (await ledgerRows()).every((row) => {
          return row.baseline;
        })
      ).toBe(true);

      const status = await runner.status();
      expect(
        status.migrations.every((entry) => {
          return entry.applied?.baseline;
        })
      ).toBe(true);

      expect(await runner.run()).toEqual({
        applied: [],
        skipped: ['one', 'two', 'three'],
      });
    } finally {
      await runner.close();
    }
  });

  test('refuses to run while the ledger holds a name nothing declares', async () => {
    const seeded = createMigrationRunner({
      log: quiet,
      migrations: [
        defineMigration({
          name: 'renamed-later',
          up: async () => {
            return undefined;
          },
        }),
      ],
    });
    await seeded.run();
    await seeded.close();

    const up = jest.fn(async () => {
      return undefined;
    });
    const runner = createMigrationRunner({
      log: quiet,
      migrations: [defineMigration({ name: 'new-name', up })],
    });

    try {
      const status = await runner.status();
      expect(
        status.unknown.map((row) => {
          return row.name;
        })
      ).toEqual(['renamed-later']);

      await expect(runner.run()).rejects.toThrow(/"renamed-later"/);
      await expect(runner.baseline({ all: true })).rejects.toThrow(
        /"renamed-later"/
      );
      expect(up).not.toHaveBeenCalled();
    } finally {
      await runner.close();
    }
  });

  test('refuses a run missing a required option before anything starts', async () => {
    const up = jest.fn(async () => {
      return undefined;
    });

    const runner = createMigrationRunner({
      log: quiet,
      migrations: [
        defineMigration({ name: 'first', up }),
        defineMigration({
          name: 'needs-owner',
          options: [
            { flag: 'owner-email', description: 'who', required: true },
          ],
          up,
        }),
      ],
    });

    try {
      await expect(runner.run()).rejects.toThrow(
        'Missing required option(s): --owner-email (needs-owner)'
      );
      // A bare flag is not a value.
      await expect(
        runner.run({ args: { 'owner-email': true } })
      ).rejects.toThrow(/owner-email/);
      expect(up).not.toHaveBeenCalled();
      expect(await ledgerRows()).toEqual([]);

      // Running only `first` needs nothing.
      expect(await runner.run({ names: ['first'] })).toEqual({
        applied: ['first'],
        skipped: [],
      });
    } finally {
      await runner.close();
    }
  });

  test('runs only the named migrations and rejects a name it does not know', async () => {
    const ran: string[] = [];
    const migration = (name: string) => {
      return defineMigration({
        name,
        up: async () => {
          ran.push(name);
        },
      });
    };

    const runner = createMigrationRunner({
      log: quiet,
      migrations: [migration('a'), migration('b'), migration('c')],
    });

    try {
      await expect(runner.run({ names: ['zzz'] })).rejects.toThrow(
        'Unknown migration: "zzz"'
      );

      // Declaration order wins over the order the names were given in.
      expect(await runner.run({ names: ['c', 'a'] })).toEqual({
        applied: ['a', 'c'],
        skipped: [],
      });
      expect(ran).toEqual(['a', 'c']);

      expect(await runner.run()).toEqual({
        applied: ['b'],
        skipped: ['a', 'c'],
      });
    } finally {
      await runner.close();
    }
  });

  test('the context probes and helpers work against the live schema', async () => {
    const sync = jest.fn(async () => {
      await verify.query(
        'CREATE INDEX IF NOT EXISTS widgets_color ON widgets (color)'
      );
    });

    const runner = createMigrationRunner({
      sync,
      log: quiet,
      migrations: [
        defineMigration({
          name: 'probe',
          up: async (ctx) => {
            expect(await ctx.tableExists({ table: 'widgets' })).toBe(true);
            expect(await ctx.tableExists({ table: 'nope' })).toBe(false);
            expect(
              await ctx.columnExists({ table: 'widgets', column: 'color' })
            ).toBe(false);

            await ctx.addColumnIfMissing({
              table: 'widgets',
              column: 'color',
              type: 'TEXT',
            });
            // Idempotent, as the name promises.
            await ctx.addColumnIfMissing({
              table: 'widgets',
              column: 'color',
              type: 'TEXT',
            });
            expect(
              await ctx.columnExists({ table: 'widgets', column: 'color' })
            ).toBe(true);

            expect(await ctx.indexExists({ index: 'widgets_color' })).toBe(
              false
            );
            await ctx.sync();
            expect(await ctx.indexExists({ index: 'widgets_color' })).toBe(
              true
            );

            await ctx.run({ sql: `UPDATE widgets SET color = 'x'` });
            await ctx.setNotNull({ table: 'widgets', column: 'color' });
            await ctx.setNotNull({ table: 'widgets', column: 'color' });

            expect(
              await ctx.countOf({
                sql: 'SELECT count(*)::text AS count FROM widgets WHERE color = $1',
                values: ['x'],
              })
            ).toBe(2);

            await ctx.dropColumnIfExists({ table: 'widgets', column: 'label' });
            await ctx.dropColumnIfExists({ table: 'widgets', column: 'label' });
            expect(
              await ctx.columnExists({ table: 'widgets', column: 'label' })
            ).toBe(false);
          },
        }),
      ],
    });

    try {
      await runner.run();
      expect(sync).toHaveBeenCalledTimes(1);

      const nullable = await rows<{ is_nullable: string }>(
        `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'widgets' AND column_name = 'color'`
      );
      expect(nullable[0].is_nullable).toBe('NO');
    } finally {
      await runner.close();
    }
  });

  test('a migration that calls sync() without one configured fails clearly', async () => {
    const runner = createMigrationRunner({
      log: quiet,
      migrations: [
        defineMigration({
          name: 'wants-sync',
          up: async (ctx) => {
            await ctx.sync();
          },
        }),
      ],
    });

    try {
      await expect(runner.run()).rejects.toThrow(/without one/);
      expect(await ledgerRows()).toEqual([]);
    } finally {
      await runner.close();
    }
  });

  test('uses the ledger table name and connection it is given', async () => {
    const runner = createMigrationRunner({
      sequelize: verify as never,
      ledgerTable: 'my_ledger',
      log: quiet,
      migrations: [
        defineMigration({
          name: 'x',
          up: async () => {
            return undefined;
          },
        }),
      ],
    });

    await runner.run();
    // Not the runner's to close, so `verify` keeps working after this.
    await runner.close();

    expect(
      (await rows<{ name: string }>('SELECT name FROM my_ledger')).map(
        (row) => {
          return row.name;
        }
      )
    ).toEqual(['x']);
    await verify.query('DROP TABLE my_ledger');
  });

  test('rejects duplicate migration names at creation', () => {
    expect(() => {
      return createMigrationRunner({
        migrations: [
          defineMigration({
            name: 'dup',
            up: async () => {
              return undefined;
            },
          }),
          defineMigration({
            name: 'dup',
            up: async () => {
              return undefined;
            },
          }),
        ],
      });
    }).toThrow('Duplicate migration name: "dup"');
  });
});

describe('parseArgv', () => {
  test('separates the command, positionals and flags', () => {
    expect(
      parseArgv([
        'run',
        'add-color',
        '--dry-run',
        '--owner-email',
        'ana@example.com',
        '--project-name=Default',
        '--verbose',
      ])
    ).toEqual({
      command: 'run',
      positionals: ['add-color'],
      flags: {
        'dry-run': true,
        'owner-email': 'ana@example.com',
        'project-name': 'Default',
        verbose: true,
      },
    });

    expect(parseArgv([])).toEqual({
      command: undefined,
      positionals: [],
      flags: {},
    });
  });
});

describe('runMigrationsCli', () => {
  const capture = () => {
    const out: string[] = [];
    const err: string[] = [];

    return {
      out,
      err,
      print: (message: string) => {
        out.push(message);
      },
      log: (message: string) => {
        err.push(message);
      },
    };
  };

  const migrations = [
    defineMigration({
      name: 'add-color',
      description: 'Gives every widget a color.',
      up: async (ctx) => {
        await ctx.addColumnIfMissing({
          table: 'widgets',
          column: 'color',
          type: 'TEXT',
        });
      },
    }),
    defineMigration({
      name: 'paint',
      options: [{ flag: 'color', description: 'The color.', required: true }],
      up: async (ctx) => {
        await ctx.run({
          sql: 'UPDATE widgets SET color = $1',
          values: [ctx.args.color],
        });
      },
    }),
  ];

  test('help and an unknown command print usage with the right exit codes', async () => {
    const noArgs = capture();
    expect(await runMigrationsCli({ argv: [], migrations, ...noArgs })).toBe(2);
    expect(noArgs.out.join('\n')).toContain('Usage: migrate <command>');
    expect(noArgs.out.join('\n')).toContain('--color (required)  The color.');
    expect(noArgs.out.join('\n')).toContain('Gives every widget a color.');

    const help = capture();
    expect(
      await runMigrationsCli({
        argv: ['help'],
        migrations,
        bin: 'flow',
        ...help,
      })
    ).toBe(0);
    expect(help.out[0]).toContain('Usage: flow <command>');

    const flag = capture();
    expect(
      await runMigrationsCli({ argv: ['--help'], migrations, ...flag })
    ).toBe(0);

    const unknown = capture();
    expect(
      await runMigrationsCli({ argv: ['frobnicate'], migrations, ...unknown })
    ).toBe(2);
    expect(unknown.err[0]).toContain('Unknown command "frobnicate"');
  });

  test('status, run and baseline drive the runner and report through print and log', async () => {
    const pending = capture();
    expect(
      await runMigrationsCli({ argv: ['status'], migrations, ...pending })
    ).toBe(0);
    expect(pending.out).toEqual(['add-color  pending', 'paint  pending']);

    const dry = capture();
    expect(
      await runMigrationsCli({
        argv: ['run', '--dry-run', '--color', 'teal'],
        migrations,
        ...dry,
      })
    ).toBe(0);
    expect(await ledgerRows()).toEqual([]);

    const missing = capture();
    expect(
      await runMigrationsCli({ argv: ['run'], migrations, ...missing })
    ).toBe(1);
    expect(missing.err.at(-1)).toContain('--color (paint)');

    // A database migrated before the ledger existed: the column is already
    // there, so the migration that adds it is recorded rather than run.
    await verify.query('ALTER TABLE widgets ADD COLUMN color TEXT');

    const baseline = capture();
    expect(
      await runMigrationsCli({
        argv: ['baseline', 'add-color'],
        migrations,
        ...baseline,
      })
    ).toBe(0);

    const run = capture();
    expect(
      await runMigrationsCli({
        argv: ['run', '--color=teal'],
        migrations,
        version: 'img-42',
        ...run,
      })
    ).toBe(0);
    expect(run.err).toContain('add-color: already applied, skipped');

    const applied = capture();
    expect(
      await runMigrationsCli({ argv: ['status'], migrations, ...applied })
    ).toBe(0);
    expect(applied.out[0]).toMatch(/^add-color {2}baseline \d{4}-/);
    expect(applied.out[1]).toMatch(/^paint {2}applied \d{4}-.* by img-42$/);

    expect(
      (await rows<{ color: string }>('SELECT color FROM widgets')).map(
        (row) => {
          return row.color;
        }
      )
    ).toEqual(['teal', 'teal']);

    // A ledger row nothing declares any more is reported and fails `status`.
    const stale = capture();
    expect(
      await runMigrationsCli({
        argv: ['status'],
        migrations: [migrations[1]],
        ...stale,
      })
    ).toBe(1);
    expect(stale.out.at(-1)).toMatch(
      /^add-color {2}in the ledger .* but not declared$/
    );
  });
});
