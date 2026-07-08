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

Status: in progress. Last checkpoint 2026-07-08T01:01:35Z.

The target is not complete yet. Current verified UO is in the product lab, not W13 storage/terminal:

```text
targetUO = 17,280
tick 75686218 product lab UO = 15
tick 75686222 W13 storage+terminal UO = 0
```

This is normal Screeps timing, not a code blocker. With `LAB_REACTION_AMOUNT = 5` and `REACTION_TIME[UO] = 10`, producing the full target requires thousands of reaction ticks. The controller will drain the product lab once it reaches the configured drain threshold or once stored plus lab/in-flight UO covers the target.

Checkpoint at 2026-07-07T23:34:15Z:

```text
tick 75686285: live console heartbeat
tick 75686288: product lab 50 UO, input labs 1950 U / 1950 O
tick 75686291: W13 terminal U=17225, O=4955, UO=0
tick 75686293: W14 storageO=10145, terminalO=500, cooldown=7
tick 75686330: product lab 70 UO, input labs 1980 U / 1990 O
```

The product lab increased by `20 UO` over the checkpoint window. This proves the controller is still producing, topping up inputs, and has not stalled. W13 storage plus terminal UO is still `0`, so the target is not complete yet.

Checkpoint at 2026-07-07T23:36:46Z:

```text
tick 75686356: live console heartbeat
tick 75686359: product lab 85 UO, input labs 1980 U / 1985 O
tick 75686361: W13 terminal U=17185, O=8430, UO=0
tick 75686364: W14 storageO=6645, terminalO=500, cooldown=6
```

The product lab increased from `70 UO` at tick `75686330` to `85 UO` at tick `75686359`. W13 oxygen staging continued, and W14 still has oxygen available. No code change is needed from this checkpoint.

Checkpoint at 2026-07-07T23:41:32Z:

```text
tick 75686389: live console heartbeat
tick 75686392: product lab 105 UO, input labs 1980 U / 1980 O
tick 75686394: W13 terminal U=17160, O=9915, UO=0
tick 75686397: W14 storageO=5145, terminalO=500, cooldown=3
tick 75686434: product lab 125 UO, input labs 1975 U / 1980 O
tick 75686437: W13 terminal U=17150, O=11895, UO=0
tick 75686440: W14 storageO=3145, terminalO=500, cooldown=0, withTask=1
```

The product lab increased from `85 UO` at tick `75686359` to `125 UO` at tick `75686434`. W13 now has most of the required oxygen staged, W14 still has oxygen available and an active lorry task, and the product lab remains below the `500 UO` drain threshold. No code change is needed from this checkpoint.

Checkpoint at 2026-07-07T23:43:49Z:

```text
tick 75686464: live console heartbeat
tick 75686466: product lab 140 UO, input labs 1970 U / 1980 O
tick 75686468: W13 terminal U=17135, O=13365, UO=0
tick 75686470: W14 storageO=1645, terminalO=500, cooldown=0, withTask=1
```

The product lab increased from `125 UO` at tick `75686434` to `140 UO` at tick `75686466`. W13 oxygen staging is nearly complete, W14 still has oxygen available and a lorry task active, and the product lab remains below the `500 UO` drain threshold. No code change is needed from this checkpoint.

Checkpoint at 2026-07-08T00:37:59Z:

```text
tick 75686493: live console heartbeat
tick 75686495: product lab 155 UO, input labs 1985 U / 1980 O
tick 75686497: W13 terminal U=17110, O=14635, UO=0
tick 75686500: W14 storageO=645, terminalO=220, cooldown=0, withTask=1
tick 75686504: W14 mineral O amount=17040
tick 75686510: no creep currently targeting W14 mineral id 59f1c0d67d0b3d79de5f0d78
tick 75686675: product lab 245 UO, input labs 1980 U / 1985 O
tick 75686679: W13 terminal U=17025, O=15050, UO=0
tick 75686682: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
tick 75687129: product lab 470 UO, input labs 1985 U / 1975 O
tick 75687205: product lab 510 UO, input labs 1970 U / 1980 O
tick 75687234: W13 lorries total=4, withTask=2, carryingUO=0, idleEmpty=1
tick 75687237: visible W13 task was an O top-up task; drain task was not visible in that narrow sample
tick 75687271: product lab drained to 45 UO, input labs 1980 U / 1975 O
tick 75687274: W13 storage UO=500, terminal U=16735, O=14750, UO=0
tick 75687277: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
```

The first product-drain cycle is verified. The product lab crossed the `500 UO` drain threshold, then W13 storage received `500 UO` and the product lab restarted production with `45 UO`. W14's pre-mined oxygen stock is nearly depleted, but W13 plus labs still hold enough staged oxygen for the current `17,280 UO` target; fresh W14 mineral oxygen remains available if the room resumes mineral mining. No code change was needed from this checkpoint.

Checkpoint at 2026-07-08T00:40:35Z:

```text
tick 75687301: live console heartbeat
tick 75687303: product lab 60 UO, input labs 1980 U / 1970 O
tick 75687305: W13 storage UO=500, terminal U=16720, O=14730, UO=0
tick 75687309: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
```

The post-drain restart remains healthy: product lab increased from `45 UO` at tick `75687271` to `60 UO` at tick `75687303`, and W13 storage still holds the first `500 UO` batch. Current staged oxygen is tight but still sufficient for the configured target on live counts: W13 terminal `14730 O` plus input lab `1970 O` plus W14 storage `365 O` leaves enough oxygen to finish `17,280 UO` when combined with stored and in-lab UO. No code change is needed from this checkpoint.

Checkpoint at 2026-07-08T00:42:54Z:

```text
tick 75687339: live console heartbeat
tick 75687342: product lab 80 UO, input labs 1975 U / 1985 O
tick 75687345: W13 storage UO=500, terminal U=16690, O=14715, UO=0
tick 75687347: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
```

Production is still advancing after the first drain cycle. Current verified UO is `580` total (`500` stored plus `80` in the product lab). Remaining target is `16,700 UO`; live oxygen available for that remaining production is `17,065 O` (`14,715` W13 terminal, `1,985` O input lab, `365` W14 storage). This still covers the configured target, but the margin is narrow and should be watched. No code change is needed from this checkpoint.

Checkpoint at 2026-07-08T00:56:08Z:

```text
tick 75687372: live console heartbeat
tick 75687375: product lab 95 UO, input labs 1975 U / 1980 O
tick 75687378: W13 storage UO=500, terminal U=16675, O=14690, UO=0
tick 75687381: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
tick 75687383: no creep currently targeting W14 mineral id 59f1c0d67d0b3d79de5f0d78
tick 75687543: product lab 180 UO, input labs 1970 U / 1980 O
tick 75687546: W13 storage UO=500, terminal U=16595, O=14610, UO=0
tick 75687549: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
```

Production advanced from `95 UO` to `180 UO` over the checkpoint window. Current verified UO is `680` total (`500` stored plus `180` in the product lab). Remaining target is `16,600 UO`; live oxygen available for that remaining production is `16,955 O` (`14,610` W13 terminal, `1,980` O input lab, `365` W14 storage), leaving about `355 O` margin. No code change is needed from this checkpoint, but oxygen margin remains narrow and W14 mineral mining is still not active.

Checkpoint at 2026-07-08T00:58:42Z:

```text
tick 75687577: live console heartbeat
tick 75687581: product lab 200 UO, input labs 1980 U / 1970 O
tick 75687584: W13 storage UO=500, terminal U=16580, O=14595, UO=0
tick 75687587: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
```

Production advanced from `180 UO` to `200 UO` in the product lab since the previous checkpoint. Current verified UO is `700` total (`500` stored plus `200` in the product lab). Remaining target is `16,580 UO`; live oxygen available for that remaining production is `16,930 O` (`14,595` W13 terminal, `1,970` O input lab, `365` W14 storage), leaving about `350 O` margin. No code change is needed from this checkpoint, but oxygen margin remains narrow.

Checkpoint at 2026-07-08T01:01:35Z:

```text
tick 75687618: live console heartbeat
tick 75687621: product lab 220 UO, input labs 1970 U / 1980 O
tick 75687624: W13 storage UO=500, terminal U=16555, O=14580, UO=0
tick 75687627: W14 storageO=365, terminalO=0, cooldown=0, withTask=0
```

Production advanced from `200 UO` to `220 UO` in the product lab since the previous checkpoint. Current verified UO is `720` total (`500` stored plus `220` in the product lab). Remaining target is `16,560 UO`; live oxygen available for that remaining production is `16,925 O` (`14,580` W13 terminal, `1,980` O input lab, `365` W14 storage), leaving about `365 O` margin. No code change is needed from this checkpoint, but oxygen margin remains narrow.

Checkpoint at 2026-07-08T01:04:32Z:

```text
upload dry-run: Same: 27
tick 75687671: live console heartbeat
tick 75687673: product lab 245 UO, input labs 1975 U / 1980 O
tick 75687675: W13 storage UO=500, terminal U=16525, O=14555, UO=0
tick 75687677: W14 storageO=365, terminalO=0, cooldown=0, withTask=0, carryingO=0
```

Production advanced from `220 UO` to `245 UO` in the product lab since the previous checkpoint. Current verified UO is `745` total (`500` stored plus `245` in the product lab). Remaining target is `16,535 UO`; live oxygen available for that remaining production is `16,900 O` (`14,555` W13 terminal, `1,980` O input lab, `365` W14 storage), leaving about `365 O` margin. Upload parity is still clean. No code change is needed from this checkpoint, but oxygen margin remains narrow.

Checkpoint at 2026-07-08T01:15:42Z:

```text
upload dry-run: Same: 27
tick 75687844: live console heartbeat
tick 75687846: product lab 330 UO, input labs 1975 U / 1980 O
tick 75687849: W13 storage UO=500, terminal U=16440, O=14470, UO=0
tick 75687852: W14 storageO=365, terminalO=0, cooldown=0, withTask=0, carryingO=0
```

Production advanced from `245 UO` to `330 UO` in the product lab since the previous checkpoint. Current verified UO is `830` total (`500` stored plus `330` in the product lab). Remaining target is `16,450 UO`; live oxygen available for that remaining production is `16,815 O` (`14,470` W13 terminal, `1,980` O input lab, `365` W14 storage), leaving about `365 O` margin. Upload parity is still clean. No code change is needed from this checkpoint.

Checkpoint at 2026-07-08T01:44:07Z:

```text
upload dry-run: Same: 27
tick 75688158: live console heartbeat
tick 75688160: product lab 485 UO, input labs 1980 U / 1975 O
tick 75688162: W13 storage UO=500, terminal U=16280, O=14305, UO=0
tick 75688164: W14 storageO=365, terminalO=0, cooldown=0, withTask=0, carryingO=0
tick 75688241: live console heartbeat after short drain wait
tick 75688243: product lab 30 UO, input labs 1980 U / 1975 O
tick 75688245: W13 storage UO=1000, terminal U=16250, O=14260, UO=0
tick 75688248: W14 storageO=365, terminalO=0, cooldown=0, withTask=0, carryingO=0
```

The second product-drain cycle is verified. The product lab reached the drain threshold after the near-threshold `485 UO` sample, then W13 storage increased from `500 UO` to `1000 UO` and the product lab restarted production at `30 UO`. Current verified UO is `1030` total (`1000` stored plus `30` in the product lab). Remaining target is `16,250 UO`; live oxygen available for that remaining production is `16,600 O` (`14,260` W13 terminal, `1,975` O input lab, `365` W14 storage), leaving about `350 O` margin. No code change is needed from this checkpoint.

Checkpoint at 2026-07-08T02:54:01Z:

```text
upload dry-run: Same: 27
tick 75689168: live console heartbeat
tick 75689170: product lab 490 UO, input labs 1975 U / 1980 O
tick 75689173: W13 storage UO=1000, terminal U=15780, O=13795, UO=0
tick 75689176: W14 storageO=365, terminalO=0, cooldown=0, withTask=0, carryingO=0
tick 75689259: live console heartbeat after short drain wait
tick 75689262: product lab 40 UO, input labs 1985 U / 1975 O
tick 75689264: W13 storage UO=1500, terminal U=15735, O=13750, UO=0
tick 75689267: W14 storageO=365, terminalO=0, cooldown=0, withTask=0, carryingO=0
```

The third product-drain cycle is verified. W13 storage increased from `1000 UO` to `1500 UO`, and the product lab restarted at `40 UO`. Current verified UO is `1540` total (`1500` stored plus `40` in the product lab). Remaining target is `15,740 UO`; live oxygen available for that remaining production is `16,090 O` (`13,750` W13 terminal, `1,975` O input lab, `365` W14 storage), leaving about `350 O` margin. No code change is needed from this checkpoint.

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
