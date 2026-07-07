# Plan: UO Stockpile Long Run

## Milestone 1: Reconfirm Baseline And Target

Acceptance criteria:

- `Documentation.md` has a fresh timestamp, `Game.time`, owned-room list, constants, target calculation, and current `U`, `O`, and `UO` stock in `W13N54` and `W14N53`.
- `Documentation.md` records current lab ids and contents for `W13N54`.
- Upload dry-run result is recorded.
- Any dirty worktree state is listed before editing.

Validation:

```sh
git status --short
npm run screeps:upload -- --dry-run --timeout 45000
```

Use the console examples in `Implement.md`. Keep every console call nonce-tagged and sequential.

## Milestone 2: Design The Smallest Automation

Acceptance criteria:

- Decide where the UO controller should live, likely `main.js` unless a narrower existing module is clearly better.
- Identify the exact task payloads needed for lorries:
  - `W14N53` storage to terminal for `O`
  - `W13N54` terminal/storage to input labs for `U` and `O`
  - output lab to `W13N54` storage or terminal for `UO`
- Record the selected lab ids in `Documentation.md`.
- Confirm no market buy/sell is required for the current target; if stock is short, stop and report the shortfall instead of buying.

Validation:

```sh
rg -n "mineral|lab|runReaction|terminal_to_storage|RESOURCE_UTRIUM|RESOURCE_OXYGEN|RESOURCE_UTRIUM_OXIDE" main.js role.spawn.js role.lorry_mineral.js role.miner.js
```

## Milestone 3: Implement Scoped Code Changes

Acceptance criteria:

- Automation calculates `targetUO` from constants and a documented seconds-per-tick setting.
- Automation only runs for owned `W13N54` and `W14N53`.
- Automation sends or moves only the amount of `O` needed for the target.
- Automation does not repeatedly overwrite lorry tasks or assign all lorries.
- Automation checks terminal cooldown and structure capacity before sending/transferring.
- Automation drains product lab and stops cleanly once `W13N54` storage plus terminal reaches target.

Validation:

```sh
node --check main.js
node --check role.spawn.js
node --check role.lorry_mineral.js
npm run screeps:upload -- --dry-run --timeout 45000
```

If root JavaScript files are intentionally dirty and dry-run blocks upload, use `--allow-dirty` only for the intended upload step and document why.

## Milestone 4: Upload And Smoke-Test

Acceptance criteria:

- Dry-run before upload is understood.
- Upload succeeds.
- Final dry-run reports all tracked modules as `Same`.
- First live samples show one of:
  - oxygen transfer is queued or happening,
  - labs are being loaded,
  - `runReaction` is producing `UO`,
  - or the controller is safely idle because the target is already met or inputs are short.

Validation:

```sh
npm run screeps:upload -- --timeout 45000
npm run screeps:upload -- --dry-run --timeout 45000
```

Then run only targeted console checks from `Implement.md`.

## Milestone 5: Monitor Until Complete Or Blocked

Acceptance criteria:

- `Documentation.md` is updated at every meaningful checkpoint.
- Monitoring cadence is no more frequent than needed; 10 to 20 real minutes is enough once reaction production is running.
- If the target is not reachable due to input shortage, terminal cooldown, missing energy, missing labs, broken lorry logistics, or dead miners, fix the durable cause if it is in scope; otherwise document the blocker.

Completion validation:

- `W13N54` storage plus terminal `UO >= targetUO`.
- Product lab is drained or below a small residual amount.
- Input labs are no longer being refilled after target completion.
- Final upload dry-run is `Same`.

## Milestone 6: Commit And Report

Acceptance criteria:

- Commit only relevant changed files.
- Include the required trailer:

```text
Co-authored-by: Codex <noreply@openai.com>
```

- Append the local Screeps action log if code was uploaded and verified.
- Final response includes the code change, live evidence, target amount, final stock amount, commit hash, and remaining risk.

