/**
 * Visual sign-off capture — renders every story in this Storybook in a real
 * Chromium, light and dark, and writes a contact sheet the owner can walk in
 * one pass instead of clicking through the catalog twice.
 *
 * It is the sign-off counterpart of the P3 review-round probe: the rounds
 * measured geometry against `@adobe/spectrum-tokens`; this one produces the
 * evidence a human looks at. It decides nothing — no thresholds, no verdicts.
 *
 *   pnpm --filter @docs/fsl-storybook run visual-signoff
 *
 * Options (env):
 *   SB_URL     Storybook base URL (default http://localhost:6007). When unset
 *              and nothing is listening, start `pnpm dev` in this package first.
 *   OUT_DIR    Output directory (default ./visual-signoff)
 *   ONLY       Substring filter on the story id (e.g. ONLY=overlay)
 *   WIDTH      Viewport width (default 1280)
 */
import { chromium } from 'playwright';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const SB_URL = process.env.SB_URL ?? 'http://localhost:6007';
const OUT_DIR = path.resolve(
  process.env.OUT_DIR ?? new URL('../visual-signoff', import.meta.url).pathname
);
const ONLY = process.env.ONLY ?? '';
const WIDTH = Number(process.env.WIDTH ?? 1280);
const MODES = ['light', 'dark'];

/**
 * Members whose story renders only a trigger: the thing under review is behind
 * a click. Stories that already ship `defaultOpen` are not listed — clicking
 * them again would close the surface. `toast` is here for the same reason as
 * the overlays even though it is a Feedback member: it publishes `alertdialog`,
 * so the clip below finds it once it exists.
 */
const OPENS_ON_CLICK = /(dialog|drawer|contextualhelp|toast)/i;

/** Selectors that prove an overlay surface is actually on screen. */
const OVERLAY_SURFACE =
  '[role="dialog"],[role="menu"],[role="tooltip"],[role="listbox"],[role="alertdialog"]';

/**
 * The sheet's running order. Sections follow the P3 review rounds recorded in
 * `packages/fsl-ui/INTERNAL/ROADMAP.md` §P3 so the walk matches the record the
 * sign-off is against; families P3 reached through its earlier slices rather
 * than through a round come last, under their own heading.
 *
 * `look` names what each round changed or ruled on. It is context for the eye,
 * not a checklist to tick — the sheet asserts nothing.
 */
const SECTIONS = [
  {
    id: 'r1',
    entity: 'Overlay',
    label: 'Rounds 1 & 2 — Overlay',
    look: 'Round 1 measured geometry and colour and fixed four findings: an anchored surface with no audited separation from the page (F-044), the fluid page inset applied to fixed overlay content (F-045), a Dialog with no minimum width (F-046), a Tooltip sized for a paragraph (F-047), plus F-048 — a surface claiming the overlay stratum shadow while painting the flat stratum fill. Look at the surface edge and shadow in dark, the inset at each width, and whether an open surface reads as lifted rather than pasted. Round 2 was behavioural (focus containment, dismiss, APG roles) and found no defect — screenshots cannot carry it; its evidence is the keyboard walk, not this sheet.',
  },
  {
    id: 'r3',
    entity: 'Feedback',
    label: 'Round 3 — Feedback',
    look: 'A fill and the rail behind it resolved to the same colour in dark (F-050); the rail had no address of its own, so three components borrowed three different tokens (F-051, now `semantic.rail.track`); the rail had no width envelope (F-052, now `--fsl-track-max-width`); Badge and StatusLight were one silhouette distinguished only by colour family (F-053, StatusLight is now dot + label). Look at rail contrast in dark, rail width at both extremes, and whether a status now reads as a status rather than a chip.',
  },
  {
    id: 'r4',
    entity: 'Collection',
    label: 'Round 4 — Collection',
    look: 'Every row painted the entity’s own resting fill instead of borrowing the container’s, so in dark a list read as a stack of filled boxes (F-055). Look at resting rows in dark across GridList, ListBox and Table — a row should materialise on hover, not sit pre-lit.',
  },
  {
    id: 'r5',
    entity: 'Navigation',
    label: 'Round 5 — Navigation',
    look: 'No defect found. Look for what the round explicitly checked and cleared: no doubled line under the selected tab, the current crumb distinguishable from its siblings, all four Link evaluations legible, and the focus ring present everywhere.',
  },
  {
    id: 'r6',
    entity: 'Disclosure',
    label: 'Round 6 — Disclosure',
    look: 'A pure refactor: Disclosure and Accordion restated one design decision under two names (F-056), now single-sourced in `disclosureAnatomy.ts`. It was verified pixel-identical before and after, so the thing to confirm here is that the two composites still look like one family — same trigger, same indicator, same panel edge.',
  },
  {
    id: 'r7',
    entity: 'Structure',
    label: 'Round 7 — Structure',
    look: 'The largest round, the fewest defects. One finding stands filed and fixed: Surface’s boundary had no address of its own at an elevated tonal stratum and in dark collided byte-for-byte with its own fill (F-057). Look at Surface at every level in dark, and at the 18 members here as a set — the point of this round is family coherence, not any single component.',
  },
  {
    id: 'slices',
    entity: ['Action', 'Input', 'Selection'],
    label: 'Reached by P3 slices, not by a round — Action, Input, Selection',
    look: 'These families were retuned component by component during P3 slices 3–5 and the forms block rather than in a review round, so they carry no round of their own. They are here because the sign-off is on the catalog the rounds left behind, and a family that drifted from the rest would show up next to it.',
  },
];

const fetchIndex = async () => {
  const res = await fetch(`${SB_URL}/index.json`);
  if (!res.ok) {
    throw new Error(
      `Storybook index unreachable at ${SB_URL} (${res.status}). Start it with \`pnpm dev\` in docs/fsl-storybook.`
    );
  }
  const { entries } = await res.json();
  return Object.values(entries)
    .filter((e) => e.type === 'story')
    .filter((e) => !ONLY || e.id.includes(ONLY));
};

const captureStory = async ({ page, story, mode }) => {
  const url = `${SB_URL}/iframe.html?viewMode=story&id=${encodeURIComponent(
    story.id
  )}&globals=mode:${mode}`;

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#storybook-root > *', { timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);

  if (OPENS_ON_CLICK.test(story.id)) {
    const trigger = page.locator('#storybook-root button').first();
    if ((await trigger.count()) > 0) {
      await trigger.click().catch(() => {});
    }
  }

  // Overlays portal outside #storybook-root, so clipping to the canvas alone
  // would miss the surface under review — but clipping to the whole viewport
  // buys that at the cost of a mostly-empty frame, which is exactly what makes
  // a sheet unreadable at two-up. The clip is the union of the canvas and any
  // overlay surface. The modal underlay is deliberately excluded: it covers the
  // viewport by definition, so including it would defeat the union.
  const clip = await page.evaluate(
    ({ surfaceSelector, pad, maxWidth, maxHeight }) => {
      const rects = [
        ...document.querySelectorAll(`#storybook-root > *, ${surfaceSelector}`),
      ]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);

      if (rects.length === 0) {
        return null;
      }

      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));

      return {
        x: 0,
        y: 0,
        width: Math.min(maxWidth, Math.ceil(right + pad)),
        height: Math.max(48, Math.min(maxHeight, Math.ceil(bottom + pad))),
      };
    },
    {
      surfaceSelector: OVERLAY_SURFACE,
      pad: 16,
      maxWidth: WIDTH,
      maxHeight: 900,
    }
  );

  const buffer = await page.screenshot({
    type: 'jpeg',
    quality: 78,
    animations: 'disabled',
    ...(clip ? { clip } : {}),
  });

  return { buffer, clip };
};

const escape = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

/** Escapes, then promotes the backtick spans the section briefs are written with. */
const prose = (value) => escape(value).replace(/`([^`]+)`/g, '<code>$1</code>');

/**
 * Writes `index.html` beside the frames: every story as one row, light and dark
 * side by side, grouped by review round. With `INLINE=1` the images are
 * embedded as data URIs so the file travels on its own.
 */
const renderSheet = async ({ manifest, inline }) => {
  const byId = new Map();
  for (const shot of manifest) {
    const entry = byId.get(shot.id) ?? {
      id: shot.id,
      title: shot.title,
      name: shot.name,
    };
    entry[shot.mode] = shot;
    byId.set(shot.id, entry);
  }
  const stories = [...byId.values()];
  const entityOf = (story) => story.title.split('/')[0];

  const src = async (shot) => {
    if (!shot?.file) {
      return null;
    }
    if (!inline) {
      return escape(shot.file);
    }
    const bytes = await fs.readFile(path.join(OUT_DIR, shot.file));
    return `data:image/jpeg;base64,${bytes.toString('base64')}`;
  };

  // The mode label sits above the frame rather than over it: a corner badge
  // covered a Meter's own value readout, which is exactly the kind of detail
  // this sheet exists to show.
  const frame = async (shot, mode) => {
    const url = await src(shot);
    if (!url) {
      return `<figure class="frame missing"><figcaption>${mode}</figcaption><span>${escape(
        shot?.error ?? 'not captured'
      )}</span></figure>`;
    }
    return `<figure class="frame"><figcaption>${mode}</figcaption><img loading="lazy" alt="${escape(
      `${shot.title} / ${shot.name} — ${mode}`
    )}" src="${url}" /></figure>`;
  };

  const sections = [];
  const placed = new Set();

  for (const section of SECTIONS) {
    const entities = [section.entity].flat();
    const members = stories.filter((s) => entities.includes(entityOf(s)));
    members.forEach((s) => placed.add(s.id));
    if (members.length === 0) {
      continue;
    }

    const rows = [];
    for (const story of members) {
      rows.push(
        `<article class="story"><h3>${escape(
          // A single-family section already names the family in its heading.
          entities.length > 1
            ? story.title
            : story.title.split('/').slice(1).join('/')
        )} <span>${escape(
          story.name
        )}</span><button class="zoom" type="button">1:1</button></h3><div class="pair">${await frame(
          story.light,
          'light'
        )}${await frame(story.dark, 'dark')}</div></article>`
      );
    }

    sections.push(
      `<section id="${section.id}"><header><p class="eyebrow">${escape(
        section.label.replace(' — ', ' · ')
      )} <span>· ${members.length * 2} frames</span></p><p class="brief">${prose(
        section.look
      )}</p></header>${rows.join('')}</section>`
    );
  }

  const orphans = stories.filter((s) => !placed.has(s.id));
  if (orphans.length > 0) {
    const rows = [];
    for (const story of orphans) {
      rows.push(
        `<article class="story"><h3>${escape(story.title)} <span>${escape(
          story.name
        )}</span><button class="zoom" type="button">1:1</button></h3><div class="pair">${await frame(
          story.light,
          'light'
        )}${await frame(story.dark, 'dark')}</div></article>`
      );
    }
    sections.push(
      `<section id="unmapped"><header><p class="eyebrow">Not mapped to a section <span>· ${
        orphans.length * 2
      } frames</span></p><p class="brief">Stories whose entity is not named above — the section map in <code>scripts/visual-signoff.mjs</code> has drifted from the catalog.</p></header>${rows.join(
        ''
      )}</section>`
    );
  }

  const nav = SECTIONS.map(
    (s) => `<a href="#${s.id}">${escape(s.label.split(' — ')[0])}</a>`
  ).join('');

  // The chrome is deliberately achromatic and never sets a corner radius: this
  // page exists so someone can judge colour and geometry, so every hue and
  // every curve on it belongs to a frame, not to the sheet around them. For the
  // same reason the chrome avoids Inter, which is the specimens' own face.
  const html = `<title>FSL P3 — visual sign-off sheet</title>
<style>
  :root {
    color-scheme: light dark;
    --ground:#ffffff; --ink:#111111; --dim:#6a6a6a; --rule:#d7d7d7; --well:#f6f6f6;
    --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    --serif: ui-serif, Georgia, "Iowan Old Style", "Times New Roman", serif;
  }
  @media (prefers-color-scheme: dark) {
    :root { --ground:#0a0a0a; --ink:#ececec; --dim:#8e8e8e; --rule:#2c2c2c; --well:#141414; }
  }
  :root[data-theme="dark"] { --ground:#0a0a0a; --ink:#ececec; --dim:#8e8e8e; --rule:#2c2c2c; --well:#141414; }
  :root[data-theme="light"] { --ground:#ffffff; --ink:#111111; --dim:#6a6a6a; --rule:#d7d7d7; --well:#f6f6f6; }

  body { background:var(--ground); color:var(--ink); font:400 15px/1.6 var(--serif); margin:0; }
  .wrap { max-width:1200px; margin:0 auto; padding:3.5rem 1.25rem 7rem; display:flex; flex-direction:column; gap:2rem; }
  :focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
  code { font:400 .88em/1 var(--mono); }

  .masthead { display:flex; flex-direction:column; gap:.9rem; }
  .masthead h1 { font:600 1.75rem/1.2 var(--serif); margin:0; letter-spacing:-.015em; text-wrap:balance; }
  .stamp { font:400 .7rem/1 var(--mono); letter-spacing:.16em; text-transform:uppercase; color:var(--dim); }
  .lede { margin:0; max-width:64ch; color:var(--dim); }
  .lede strong { color:var(--ink); font-weight:600; }
  .caveat { margin:0; max-width:70ch; padding:1rem 1.15rem; background:var(--well); border-left:3px solid var(--ink); }

  nav { position:sticky; top:0; z-index:2; display:flex; flex-wrap:wrap; gap:1.1rem; padding:.85rem 0; background:var(--ground); border-bottom:1px solid var(--rule); }
  nav a { font:400 .7rem/1 var(--mono); letter-spacing:.12em; text-transform:uppercase; text-decoration:none; color:var(--dim); border-bottom:1px solid transparent; padding-bottom:.15rem; }
  nav a:hover { color:var(--ink); border-bottom-color:var(--ink); }

  section { scroll-margin-top:4.5rem; display:flex; flex-direction:column; gap:1.6rem; }
  section > header { border-top:3px solid var(--ink); padding-top:.85rem; display:flex; flex-direction:column; gap:.6rem; }
  .eyebrow { margin:0; font:500 .74rem/1.3 var(--mono); letter-spacing:.14em; text-transform:uppercase; }
  .eyebrow span { color:var(--dim); font-variant-numeric:tabular-nums; }
  .brief { margin:0; max-width:74ch; color:var(--dim); font-size:.95rem; }

  .story { display:flex; flex-direction:column; gap:.5rem; }
  .story h3 { margin:0; font:500 .82rem/1.3 var(--mono); letter-spacing:.02em; display:flex; align-items:baseline; gap:.55rem; flex-wrap:wrap; }
  .story h3 span { color:var(--dim); font-weight:400; }
  .zoom { font:400 .66rem/1.4 var(--mono); letter-spacing:.08em; padding:.05rem .4rem; border:1px solid var(--rule); background:transparent; color:var(--dim); cursor:pointer; }
  .zoom:hover { color:var(--ink); border-color:var(--ink); }
  .story.wide .zoom { color:var(--ground); background:var(--ink); border-color:var(--ink); }

  .pair { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .story.wide .pair { grid-template-columns:1fr; }
  @media (max-width:760px) { .pair { grid-template-columns:1fr; } }

  .frame { margin:0; border:1px solid var(--rule); overflow:hidden; }
  .frame figcaption { font:400 .62rem/1 var(--mono); letter-spacing:.16em; text-transform:uppercase; color:var(--dim); padding:.35rem .55rem; border-bottom:1px solid var(--rule); }
  .frame img { display:block; width:100%; height:auto; }
  .missing { display:grid; place-items:center; min-height:80px; color:var(--dim); font:400 .78rem/1.4 var(--mono); padding:1rem; text-align:center; }
</style>
<div class="wrap">
<div class="masthead">
  <p class="stamp">fsl Storybook · Chromium ${WIDTH}px · light + dark · ${
    stories.length * 2
  } frames</p>
  <h1>FSL P3 — visual sign-off sheet</h1>
  <p class="lede">Every story in the catalog, both colour modes side by side, in the order of the P3 review rounds, with what each round changed stated beside the frames it touched. Two-up halves each frame’s scale — <strong>1:1</strong> on a row stacks its two modes at full width when something needs a closer look.</p>
  <p class="caveat">This sheet is evidence, not a verdict. The rounds closed their findings and <code>FRICTION.md</code> is at zero open — that is a separate fact from the owner’s visual sign-off, which no generated artefact can perform. Anything wrong that you see here becomes a new <code>FRICTION.md</code> entry, numbered from the highest <code>F-###</code> in the file.</p>
</div>
<nav>${nav}</nav>
${sections.join('')}
</div>
<script>
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.zoom');
    if (button) {
      button.closest('.story').classList.toggle('wide');
    }
  });
</script>
`;

  const file = path.join(OUT_DIR, inline ? 'sheet-inline.html' : 'index.html');
  await fs.writeFile(file, html);
  console.log(`sheet → ${file}`);
};

const main = async () => {
  // Re-rendering the sheet is cheap and re-capturing is not, so editing the
  // section map does not cost another Chromium pass.
  if (process.env.SHEET_ONLY === '1') {
    const manifest = JSON.parse(
      await fs.readFile(path.join(OUT_DIR, 'manifest.json'), 'utf8')
    );
    await renderSheet({ manifest, inline: false });
    if (process.env.INLINE === '1') {
      await renderSheet({ manifest, inline: true });
    }
    return;
  }

  const stories = await fetchIndex();
  if (stories.length === 0) {
    throw new Error(`No stories matched ONLY=${ONLY}`);
  }
  console.log(`${stories.length} stories × ${MODES.length} modes`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  // `CHROMIUM_PATH` lets a sandbox point at a preinstalled Chromium whose
  // build number does not match the pinned playwright package.
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  const manifest = [];

  try {
    for (const mode of MODES) {
      const context = await browser.newContext({
        viewport: { width: WIDTH, height: 900 },
        deviceScaleFactor: 1,
        colorScheme: mode,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();

      for (const story of stories) {
        const file = `${story.id}--${mode}.jpg`;
        try {
          const { buffer } = await captureStory({ page, story, mode });
          await fs.writeFile(path.join(OUT_DIR, file), buffer);
          manifest.push({
            id: story.id,
            title: story.title,
            name: story.name,
            mode,
            file,
            bytes: buffer.length,
          });
          console.log(`  ✓ ${file} (${(buffer.length / 1024).toFixed(0)}kB)`);
        } catch (error) {
          console.log(`  ✗ ${file} — ${error.message}`);
          manifest.push({
            id: story.id,
            title: story.title,
            name: story.name,
            mode,
            error: String(error.message),
          });
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  await renderSheet({ manifest, inline: false });
  if (process.env.INLINE === '1') {
    await renderSheet({ manifest, inline: true });
  }

  const failed = manifest.filter((m) => m.error);
  console.log(
    `\n${manifest.length - failed.length} captured, ${failed.length} failed → ${OUT_DIR}`
  );
  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

await main();
