# Documentation: UO Stockpile Long Run

## Current Status

Prepared on 2026-07-07 UTC.

Status: ready for long-running execution. No bot code changes were made during prep.

The prep file stack mirrors the long-horizon Codex pattern of a frozen spec, checkpoint plan, execution runbook, and continuously updated status log.

## Prep-Time Findings

### Repo State

Command:

```sh
git status --short
```

Result at prep time:

```text
 M role.spawn.js
```

The existing local change in `role.spawn.js` introduces `extractorPickupMinAmount = 100` and changes extractor pickup detection from `> 0` to `>= extractorPickupMinAmount`. Do not revert it. Upload dry-run reported the live branch already matches local tracked modules.

Upload dry-run:

```text
Branch: ScreepJandi
Tracked root modules: 27
Same: 27
Changed: -
Local only: -
Live only: -
```

### Live Baseline

Owned rooms at tick `75685538`:

```json
{"rooms":["W13N54","W14N53"]}
```

Live constants at tick `75685551`:

```json
{
  "EXTRACTOR_COOLDOWN": 5,
  "LAB_REACTION_AMOUNT": 5,
  "REACTION_TIME_UO": 10,
  "HARVEST_MINERAL_POWER": 1
}
```

Target with 3.0 seconds per tick:

```text
targetUO = ceil((259200 / 3.0) * 1 / 5) = 17,280
```

`W13N54` stock at tick `75685540`:

```json
{
  "mineral": {"type":"U","amount":50030},
  "container": null,
  "storage": {"U":0,"O":0,"UO":0,"energy":522392},
  "terminal": {"U":19260,"O":0,"UO":0,"energy":48999},
  "terminalCooldown":0
}
```

`W14N53` stock at tick `75685542`:

```json
{
  "mineral": {"type":"O","amount":17040},
  "container": null,
  "storage": {"U":0,"O":17645,"UO":0,"energy":377589},
  "terminal": {"U":0,"O":0,"UO":0,"energy":52314},
  "terminalCooldown":0
}
```

`W13N54` labs at tick `75685544`:

```json
[
  {"id":"69150a6b19a68026a54e5c43","x":28,"y":24,"mineralType":null,"amount":0,"energy":2000,"cooldown":0},
  {"id":"6923b9afffd2ab6bd3de6cd0","x":29,"y":25,"mineralType":null,"amount":0,"energy":2000,"cooldown":0},
  {"id":"6923ef5abb5c2575a38ade0c","x":29,"y":24,"mineralType":null,"amount":0,"energy":2000,"cooldown":0}
]
```

### Initial Assessment

`W13N54` has enough `U` for the default target (`19,260 U` in terminal, target `17,280 UO`).

`W14N53` has enough `O` for the default target (`17,645 O` in storage, target `17,280 UO`), but the buffer is small. If measured tick rate is materially faster than 3.0 seconds per tick, the run may need more oxygen from mining before completion.

Current `UO` stock is `0` in the checked storage and terminal locations.

The current `main.js` hard-coded lab ids do not match the live `W13N54` lab ids observed above. Any UO automation should use the live `W13N54` lab ids, not the old `59c...` ids, unless fresh inspection proves those old labs are relevant elsewhere.

## Decision Log

- Use `W13N54` as the main room unless fresh inspection disproves it.
- Use `W14N53` as the oxygen source room unless fresh inspection disproves it.
- Use `W13N54` storage plus terminal as the stockpile count.
- Do not use market buys/sells without user approval.
- Prefer a narrow room-specific controller over a broad lab-system rewrite.

## Milestone Log

### Milestone 1: Reconfirm Baseline And Target

Status: completed at 2026-07-07T23:03:20Z.

Execution dirty state before edits:

```text
 M role.spawn.js
?? long-horizon/
```

The dirty `role.spawn.js` state is the known extractor-pickup threshold change from prep. The `long-horizon/` files are the durable task docs for this run.

Upload dry-run at execution start:

```text
Branch: ScreepJandi
Tracked root modules: 27
Same: 27
Changed: -
Local only: -
Live only: -
```

Fresh owned rooms at tick `75685848`:

```json
{"rooms":["W13N54","W14N53"]}
```

Fresh constants at tick `75685850`:

```json
{
  "EXTRACTOR_COOLDOWN": 5,
  "LAB_REACTION_AMOUNT": 5,
  "REACTION_TIME_UO": 10,
  "HARVEST_MINERAL_POWER": 1
}
```

Fresh `W13N54` stock at tick `75685852`:

```json
{
  "mineral": {"type":"U","amount":49770},
  "container": null,
  "storage": {"U":0,"O":0,"UO":0,"energy":522392},
  "terminal": {"U":19260,"O":0,"UO":0,"energy":48630},
  "terminalCooldown":0
}
```

Fresh `W14N53` stock at tick `75685855`:

```json
{
  "mineral": {"type":"O","amount":17040},
  "container": null,
  "storage": {"U":0,"O":17645,"UO":0,"energy":377589},
  "terminal": {"U":0,"O":0,"UO":0,"energy":50210},
  "terminalCooldown":0
}
```

Fresh `W13N54` labs at tick `75685857`:

```json
[
  {"id":"69150a6b19a68026a54e5c43","x":28,"y":24,"mineralType":null,"amount":0,"energy":2000,"cooldown":0},
  {"id":"6923b9afffd2ab6bd3de6cd0","x":29,"y":25,"mineralType":null,"amount":0,"energy":2000,"cooldown":0},
  {"id":"6923ef5abb5c2575a38ade0c","x":29,"y":24,"mineralType":null,"amount":0,"energy":2000,"cooldown":0}
]
```

Tick-rate sample:

```text
75685860 -> 75685875 over a 60-second sleep, roughly 4.0 seconds per tick.
```

The measured tick rate would produce a lower target, but the run keeps `targetUO = 17,280` because the prompt names that as the minimum target and asks the stockpile to err toward overstocking.

### Milestone 2: Design The Smallest Automation

Status: completed at 2026-07-07T23:08:00Z.

Validation/search command:

```sh
rg -n "mineral|lab|runReaction|terminal_to_storage|RESOURCE_UTRIUM|RESOURCE_OXYGEN|RESOURCE_UTRIUM_OXIDE" main.js role.spawn.js role.lorry_mineral.js role.miner.js
```

Selected implementation:

- Add a narrow `main.js` UO stockpile controller for only `W13N54` and `W14N53`.
- Keep the existing extractor/container hauling safeguards intact.
- Reuse `role.lorry_mineral.js` task execution with `mode: "terminal_to_storage"` and `once: true` for bounded one-trip transfers.
- Add a helper that assigns at most one idle, empty, non-link-relay lorry per source/target/resource lane.
- Move `O` from `W14N53` storage to its terminal, then use `terminal.send` to move only needed `O` to `W13N54`.
- Load `W13N54` input labs from W13 storage/terminal only when raw reagents are still needed.
- Run `U + O -> UO` until the stockpile target is met or already covered by product waiting in the product lab.
- Drain product and leftover input labs to W13 storage once the target is met or product lab contents are enough to meet it after hauling.

Selected W13 lab roles:

```json
{
  "productUO": "69150a6b19a68026a54e5c43",
  "inputU": "6923b9afffd2ab6bd3de6cd0",
  "inputO": "6923ef5abb5c2575a38ade0c"
}
```

No market buy/sell is needed for the current target: W13 has `19,260 U`, W14 has `17,645 O`, and the target remains `17,280 UO`.

### Milestone 3: Implement Scoped Code Changes

Status: completed at 2026-07-07T23:09:28Z.

Changed file:

- `main.js`

Validation:

```text
node --check main.js
node --check role.spawn.js
node --check role.lorry_mineral.js
git diff --check -- main.js role.spawn.js role.lorry_mineral.js long-horizon/uo-stockpile/Documentation.md
```

All checks passed with no output.

Upload dry-run after implementation:

```text
Branch: ScreepJandi
Tracked root modules: 27
Same: 26
Changed: main
Local only: -
Live only: -
```

Implementation notes:

- `targetUO` is calculated from `days`, `secondsPerTick`, `HARVEST_MINERAL_POWER`, and `EXTRACTOR_COOLDOWN`.
- The controller is limited to `W13N54` and `W14N53`.
- Terminal sends are internal only: `W14N53` to `W13N54` for `RESOURCE_OXYGEN`.
- Lorry tasks are one-trip, bounded transfers and require an idle empty non-link-relay lorry.
- Carried `O` and `UO` in W13 lorries are counted as in-flight inventory to avoid repeated over-sending or over-producing while a transfer is underway.
- Once stored `UO` or stored plus product-lab/in-flight `UO` covers the target, the controller stops loading reagents and drains product/input labs to W13 storage.

### Milestone 4: Upload And Smoke-Test

Status: completed at 2026-07-07T23:27:04Z.

Upload sequence:

```text
npm run screeps:upload -- --allow-dirty --timeout 45000
Verified 27 live modules.

npm run screeps:upload -- --dry-run --timeout 45000
Same: 27
Changed: -
```

The upload used `--allow-dirty` because the repo has intentional uncommitted root JavaScript changes during bot deployment, and `role.spawn.js` was already dirty/live from prep.

Initial combined smoke snapshots timed out twice, so monitoring switched back to small one-purpose nonce-tagged reads.

First smoke issue:

- At tick `75686045`, Henry had a U lab-load task but was carrying energy, so the one-trip mineral task could not withdraw U.
- `role.lorry_mineral.js` was patched so one-trip mineral tasks first offload non-task cargo to room storage/terminal.
- `main.js` was patched so if no idle empty lorry is available, one non-link, non-temporary lorry carrying only energy can be assigned; the task runner preserves that energy before mineral work.
- Re-uploaded `main.js` and `role.lorry_mineral.js`; final dry-run returned `Same: 27`.

Live smoke evidence:

```text
tick 75686164: W13N54 lorries withTask=1, carryingU=500
tick 75686169: W14N53 storageO=16645, terminalO=500, terminal cooldown=1
tick 75686172: W13N54 terminal U=18760, O=1000, UO=0
tick 75686194: labs product=5 UO, inputU=495 U, inputO=495 O
tick 75686218: labs product=15 UO, inputU=985 U, inputO=985 O
tick 75686222: W13N54 terminal U=17760, O=2500, UO=0
tick 75686225: W14N53 storageO=13645, terminalO=0, cooldown=5, withTask=1, carryingO=500
```

The controller is verified through oxygen staging/sending, W13 lab loading, and active `U + O -> UO` reactions.

### Milestone 5: Monitor Until Complete Or Blocked

Status: in progress.

The target is not complete yet. Current verified UO is in the product lab, not W13 storage/terminal:

```text
targetUO = 17,280
tick 75686218 product lab UO = 15
tick 75686222 W13 storage+terminal UO = 0
```

This is normal Screeps timing, not a code blocker. With `LAB_REACTION_AMOUNT = 5` and `REACTION_TIME[UO] = 10`, producing the full target requires thousands of reaction ticks. The controller will drain the product lab once it reaches the configured drain threshold or once stored plus lab/in-flight UO covers the target.

### Milestone 6: Commit And Report

Status: completed at 2026-07-07T23:28:26Z.

Committed files:

```text
long-horizon/uo-stockpile/Documentation.md
long-horizon/uo-stockpile/Implement.md
long-horizon/uo-stockpile/Plan.md
long-horizon/uo-stockpile/Prompt.md
long-horizon/uo-stockpile/START.md
main.js
role.lorry_mineral.js
```

The pre-existing dirty `role.spawn.js` extractor-pickup threshold change was intentionally left unstaged.

Local ignored action log updated:

```text
/root/ScreepJandi/.screeps-code-change-actions.log
```

## Known Risks

- A broad Screeps console snapshot timed out during prep. Keep future checks narrow.
- Current oxygen stock is only slightly above the default target.
- Lab reactions can run for many hours; the task should update this file during monitoring rather than relying on memory.
- The existing mineral/lab code contains stale hard-coded lab ids and disabled broad lorry-task blocks.
- The worktree starts dirty because of `role.spawn.js`; stage only files intentionally changed by the long-running task.
