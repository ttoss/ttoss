---
title: Project Parameters
sidebar_position: 2
---

# Project Parameters

The [delivery process](process.md) is the engine, the same for every project; these are its extension points, and a project's answers to them are how it delivers. The tick reads them from the consuming repo, first match wins: the `/flow <project id>` argument (project id only), `.agents/flow.md`, `.claude/flow.md`, or a `## Flow parameters` section of `AGENTS.md` / `CLAUDE.md`. [`/flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) defines them with the user. They bind every session working in the repo, not only the loop's.

A value is a short rule written inline, or a pointer to the project file that holds it (`` `docs/agents/release.md` ``). A pointer keeps one source of truth: the tick and every child read the file, never a copy.

## Identity

| Parameter | Required | What it is |
| --- | --- | --- |
| Flow project id | yes | `proj_...` |
| Standing-decision task id | yes | the `decision` that authorises the loop (GTF-T1); every run of the loop names it as its `authority` |
| Repos | no | every repo the tasks touch, so children start with them |

## Runtime

How this project's runtime runs the loop, usually a pointer to the file the scheduler runs. Empty: the tick uses what its tools offer and the defaults below.

- **Child runs:** how the runtime starts a child (prompt, model, repos), reads it (working, idle, failed, gone), ends it and, where it can, messages it; which tools a tick loads.
- **Run records:** whether a hook records each session's run (GTF-S7); without one, the tick records its children and a session nobody started records itself.
- **Max runs:** how many children each person's ticks run at once: the `running` children their Flow credential wrote, never another person's. Default 2.
- **Child handoff:** where a child stops. `push` (default): the change is proposed and ready, its gates left to the tick. `verdict`: the child stays until the verdict, fixing red checks and findings itself, which costs a live child per change but keeps its memory of why. A runtime whose children end with the tick needs `push`.
- **Models:** the child's model (default: the tick's), the check model for checks and other read-only work (default: a mid-tier model), and the review model for the reviews the loop runs (default: the child's).
- **Each run:** cleanup the runtime needs in every run of a routine, such as recording the usage of runs already closed and ending their sessions.

A runtime several projects share is a preset, which the project's `Runtime` names and completes with what differs: [Claude Code sessions](https://github.com/ttoss/skills/blob/main/skills/flow/references/runtime-claude-code-remote.md).

## Routines

What fires the runs, one row each: what fires it (a schedule with its time zone, or an event), what it runs (a skill's invocation, or a file on the default branch), its model and its connectors. The [standard routines](routines.md#standard-routines), the rules every routine follows and the shapes of a project's own are in [Routines](routines.md). Empty: nothing fires the tick, which runs only when somebody invokes `/flow`.

## Extension points

Each answers a question the process asks but cannot answer for every project. Left empty, the loop uses the last column, and the first report names the defaults in force.

| Parameter | The process asks | Default when empty |
| --- | --- | --- |
| Intake | Where new work comes from and what a new task must carry; what an agent does with work it notices outside its task; what becomes of a change that names no task | a task carries its `source` and what was investigated; noticed work is an `incubated` task with its `source` and the words verbatim (GTF-C1); a change with no task is left alone |
| Ready brief | What a task must state before a child may start it, and what counts as more than one delivery, which the tick splits before delegating | an objective and an acceptance a child can check; more than one delivery that can ship alone (code and its guard, backend and screen, a migration and its use, more than one repo) is split |
| Decisions | Which choices always go to a person, and how an agent tests any other open choice before raising it | reserved: product intent, security, auth, billing, data loss, migrations, public contracts, and changes to the project's agent instructions; every other choice the task and the standing decision leave open is raised |
| Before proposing | What the implementer runs and decides before it proposes a change: checks that reproduce the gates, so the change goes up green, and what every change records in its description, such as a flag, its monitoring, what a new scheduled job does on its first run, or the order of a migration and its use | the repo's own fast checks: lint, typecheck and the tests of what changed; nothing else recorded |
| Review | Who reviews a change (`none` is valid; `the loop` is a review child the tick starts once the change's checks pass), who asks for the review and when, and what the tick does with a request that got lost | none: the gates are the checks |
| Merge rule | When a change may be integrated and by whom; what only a person may integrate; how many automatic rounds each reason gets | the gates green on the change's head, no conflict, no blocking review thread; the loop integrates; one automatic round per reason, a red caused outside the change not counted |
| Release procedure | After integrating, what puts the change in effect: which steps the loop runs, which are automatic, which are a person's | none: integrated is in effect once its pipeline passes |
| Closing evidence | What proves a task done, where it is checked (the target, every credential its checks use, which calls are read-only) and who reads the checks | integrated and its pipeline green; a check that needs a target the project did not name waits on a person |
| Delivery kinds | Which deliveries are not a change through the code host, and for each, its gates, who integrates it and what proves it | none: every delivery is a pull request |

## Release procedure shapes

None is the loop's own; [`/flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) offers the one that matches what the repo shows:

- **Continuous:** every integration deploys; the task waits for its pipeline, then its check.
- **Per-integration publish and consumer bump:** each integration publishes a package; the bump of a consumer is its own task that `blocks` what it ships.
- **Manual:** a person releases; the tasks wait on them.

Any other shape, such as a batched release, is the project's own answer, in the file its `Release procedure` points to; the loop holds it to GTF-N4: a step `blocks` what it ships, never the reverse.

An example parameters file is in [bootstrap](https://github.com/ttoss/skills/blob/main/skills/flow-setup/bootstrap.md#the-parameters-file).
