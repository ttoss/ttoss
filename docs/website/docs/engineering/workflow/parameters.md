---
title: Project Parameters
sidebar_position: 3
---

# Project Parameters

The [delivery process](process.md) is the engine, the same for every project; these are its extension points, and a project's answers to them are how it delivers. The tick reads them from the consuming repo, first match wins: the `/flow <project id>` argument (project id only), `.agents/flow.md`, `.claude/flow.md`, or a `## Flow parameters` section of `AGENTS.md` / `CLAUDE.md`. They bind every session working in the repo, not only the agents'.

A value is a short rule written inline, or a pointer to the project file that holds it (`` `docs/agents/release.md` ``). A pointer keeps one source of truth: the tick and every child read the file, never a copy.

The file is a list of `- **Name**: value` items, because the routines' scripts read it: the project and decision ids, the repos, and the numbers and switches the engine runs on (`Max runs`, `Stale after`, the rounds, whether the tick starts a review child, the `Reviewer` identities, whether agents integrate, the Chase's size), each from an item of its own when there is one, else from the prose that states it, else the default. The [`flow` skill's parameters script](https://github.com/ttoss/skills/blob/main/skills/flow/scripts/params.mjs) says what it read and where each value came from.

## Identity

| Parameter | Required | What it is |
| --- | --- | --- |
| Flow project id | yes | `proj_...` |
| Standing-decision task id | yes | the `decision` that authorises the agents (GTF-T1); the tick's run names it as its `authority`, and every child acts under it through `parent` |
| Repos | no | every repo the tasks touch, so children start with them |

## Runtime

How this project's runtime runs the tick and its children, usually a pointer to the file the scheduler runs. Empty: the tick uses what its tools offer and the defaults below.

- **Child runs:** how the runtime starts a child (prompt, model, repos), reads it (working, idle, failed, gone), ends it and, where it can, messages it; which tools a tick loads.
- **Code host:** how a run reads a change and integrates it, when its tools offer more than one way and only one is permitted. Empty: what its tools offer.
- **Run records:** whether a hook records each session's run (GTF-S7); without one, the tick records its children and a session nobody started records itself.
- **Max runs:** how many children each person's ticks run at once: the `running` children their Flow credential wrote, never another person's. Default 3. From 2 up, new work never takes the last free slot; it stays for what ages faster ([Cost of delay orders the work](./principles.md#cost-of-delay-orders-the-work-read-from-a-proxy-nobody-estimates)).
- **Release queue:** how many changes may wait in the [release queue](process.md#where-work-waits) before the tick stops starting new work. It also sizes the Chase's two lists. Default 20.
- **Stale after:** how long a child's run may stay `running` before a tick that cannot read it takes it as abandoned and closes it, and how long a review request may wait for a reviewer outside the tick before it counts as lost. Every run records it as its `hold_minutes`, so Flow holds the run's tasks from other runs for as long. Default 4 hours.
- **Models:** the child's model (default: the tick's), the check model for checks and other read-only work (default: a mid-tier model), and the review model for the reviews the agents run (default: the child's). Each is an exact model id, never an alias or a tier such as `latest` ([One engine, extended for any project](./principles.md#one-engine-extended-for-any-project)); [`/flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) writes the id each default resolves to.
- **Each run:** cleanup the runtime needs in every run of a routine, such as recording the usage of runs already closed and ending their sessions.

A runtime several projects share is a preset, which the project's `Runtime` names and completes with what differs: [Claude Code sessions](https://github.com/ttoss/skills/blob/main/skills/flow/references/runtime-claude-code-remote.md).

## Routines

What fires the runs, one row each: what fires it (a schedule with its time zone, or an event), what it runs (a skill's invocation, or a file on the default branch), its model (an exact id, as in `Models`) and its connectors. The [standard routines](routines.md#standard-routines), the rules every routine follows and the shapes of a project's own are in [Routines](routines.md). Empty: nothing fires the tick, which runs only when somebody invokes `/flow`.

## Extension points

Each answers a question the process asks but cannot answer for every project. Left empty, the workflow uses the last column, and the first report names the defaults in force.

| Parameter | The process asks | Default when empty |
| --- | --- | --- |
| Intake | Where new work comes from and what a new task must carry; what an agent does with work it notices outside its task; what becomes of a change that names no task | a task carries its `source` and what was investigated; noticed work is an `incubated` task with its `source` and the words verbatim, unless the standing decision names what the agents write from what they notice (GTF-C1); a change with no task is left alone |
| Ready brief | What a task must state before a child may start it, beyond the [closing validation](#closing-validations) every brief names, and what counts as more than one delivery, which the tick splits before delegating | an objective, its purpose (the end state it serves, and why) and an acceptance a child can check; more than one delivery that can ship alone (code and its guard, backend and screen, a migration and its use, more than one repo) is split |
| Decisions | Which choices always go to a person, and how an agent tests any other open choice before raising it | the [default below](#the-decisions-default) |
| Before proposing | What the implementer runs and decides before it proposes a change: checks that reproduce the gates, so the change goes up green, and what every change records in its description, such as a flag, its monitoring, what a new scheduled job does on its first run, or the order of a migration and its use | the repo's own fast checks: lint, typecheck and the tests of what changed; the description names every change to the change's own gates (a test removed or skipped, a threshold lowered, CI configuration or required checks altered) and why, and the change's reversal path (a revert, a flag, a paired down-migration), which the tick pulls when the integration proves harmful, or that it has none and why, which sends that harm to a person instead |
| Review | Who reviews a change (`none` is valid; `an agent` is a review child the tick starts once the change's checks pass), who asks for the review and when, and what the tick does with a request that got lost (`Stale after` says when). A verdict is the `flow/review` commit status on the head (`success`, `failure`, `pending` while the reviewer works), from the `Reviewer` identities when named, else any with write access; the code host requires it | none: the gates are the checks; a file that does not state `Review` is asked about on every tick, never read as none |
| Merge rule | When a change may be integrated and by whom; what only a person may integrate; how many automatic rounds each reason gets, and which findings go to a person with no round | the gates green on the change's head, no conflict, no blocking review thread; the agents integrate ([Autonomy is bounded by reversibility](./principles.md#autonomy-is-bounded-by-reversibility)), except a change to what judges or instructs the agents (its own gates, as `Before proposing` names them, or the agents' instructions), which a person integrates ([The author never verifies its own work](./principles.md#the-author-never-verifies-its-own-work)); one automatic round per reason, a red caused outside the change not counted |
| Release procedure | After integrating, what puts the change in effect: which steps the agents run, which are automatic, which are a person's | none: integrated is in effect once its pipeline passes |
| Closing evidence | The project's [closing validations](#closing-validations), each with its name, what it proves, where it is checked (the target, every credential its checks use, which calls are read-only), who reads it and which tasks it fits; whether the agent chooses what integrating leaves when the handoff does not say it | one validation, integrated and its pipeline green, fitting every task; a check that needs a target the project did not name waits on a person; what integrating leaves, when the handoff does not say it, is a person's |
| Delivery kinds | Which deliveries are not a change through the code host, and for each, its gates, who integrates it and what proves it | none: every delivery is a pull request |

## The Decisions default

Reserved to a person: product intent, security, auth, billing, data loss, migrations, public contracts, and changes to the project's agent instructions. Every other open choice passes two tests before it is raised. **Dominance**: an option that improves something and worsens nothing, checked in the run and naming what was checked, is taken. **Long term**: else the option that wins on durability (enforced by the system > context scoped to a path > procedure > prose), on debt that stays modular, visible and cheap to repay, on not replicating an antipattern already in the repo, and on not eroding an ownership boundary is taken. What survives both is raised. A choice answered by a test is recorded in the change's description (`Q`, `A`, the test, what was checked); one answered silently counts as unanswered ([Autonomy is bounded by reversibility](./principles.md#autonomy-is-bounded-by-reversibility)).

A choice that fails both tests and recurs is what a project's standing decision may answer as a rule instead. For example, retracting a `blocks` edge whose source's change integrated while the source waits for its release or check is a person's by default, since building on unvalidated work makes reverting the source cost more; a standing decision such as "a code-only dependency is released on integration" lets the tick retract it.

## Closing validations

`Closing evidence` lists every way a task of the project can be proven done, and a ready brief names the one its task closes on before a child starts it. A task fits the validation of what it promises, never the strictest the project has: a refactor or an internal component whose promise is code alone closes at integration with its pipeline green, and a feature or a public contract waits for the release and the check that show it in effect. So the list always holds the validation at integration, beside whatever post-release checks the project adds, and the handoff's `after_integration` follows the validation the brief names: `close` for the one at integration, `release` or `check` for the others. An implementer that finds another validation fits says which and why in the change's description.

A task that needs another's code and not its effect then waits only for that task's integration, because what puts the code in effect is a release step of its own (GTF-N4) or a check on a task that promised the effect.

## Release procedure shapes

None is the workflow's own; [`/flow-setup`](https://github.com/ttoss/skills/blob/main/skills/flow-setup/SKILL.md) offers the one that matches what the repo shows:

- **Continuous:** every integration deploys; the task waits for its pipeline, then its check.
- **Per-integration publish and consumer bump:** each integration publishes a package; the bump of a consumer is its own task that `blocks` what it ships.
- **Manual:** a person releases; the tasks wait on them.

Any other shape, such as a batched release, is the project's own answer, in the file its `Release procedure` points to; the tick holds it to GTF-N4: a step `blocks` what it ships, never the reverse.

An example parameters file is in [bootstrap](https://github.com/ttoss/skills/blob/main/skills/flow-setup/bootstrap.md#the-parameters-file).
