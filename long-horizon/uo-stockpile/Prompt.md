# Prompt: UO Stockpile For Three Days Of Mining

## Goal

Create and verify durable Screeps bot behavior that stockpiles `RESOURCE_UTRIUM_OXIDE` (`UO`) in the main room for three real days worth of extractor mining.

The current working assumption is:

- Main room: `W13N54`
- Support room: `W14N53`
- Compound: `U + O -> UO`
- Stockpile destination: `W13N54` storage or terminal

Re-check these assumptions at the start of the run. If room ownership, room visibility, lab layout, or current stock differs, update `Documentation.md` before changing code.

## Target

Use the live Screeps constants rather than hard-coding game math. The prep-time constants from tick `75685551` were:

- `EXTRACTOR_COOLDOWN = 5`
- `HARVEST_MINERAL_POWER = 1`
- `LAB_REACTION_AMOUNT = 5`
- `REACTION_TIME[RESOURCE_UTRIUM_OXIDE] = 10`

Target formula:

```text
targetUO = ceil((3 * 24 * 60 * 60 / measuredSecondsPerTick) * HARVEST_MINERAL_POWER / EXTRACTOR_COOLDOWN)
```

Use `measuredSecondsPerTick = 3.0` unless a fresh measurement shows otherwise. With the prep-time constants and 3.0 seconds per tick, the minimum target is:

```text
targetUO = 17,280
```

Use the cooldown denominator of `EXTRACTOR_COOLDOWN`, not `EXTRACTOR_COOLDOWN + 1`, so the target errs toward overstocking rather than understocking.

## Hard Constraints

- Preserve unrelated local changes. At prep time, `role.spawn.js` had an uncommitted extractor-pickup threshold change that was already live according to upload dry-run.
- Do not use broad live room dumps. Use short, nonce-tagged console expressions with `try/catch`.
- Do not run multiple `npm run screeps:console` commands in parallel.
- Do not buy or sell market resources without explicit user approval. Internal terminal transfer between owned rooms is allowed if energy is available.
- Do not git push unless the user explicitly asks for a Git push.
- Keep normal energy logistics healthy. Mineral work must not retask every lorry or starve core hauling.
- Keep the automation bounded: when the target UO stockpile is reached, stop loading new reagents and drain reaction/product labs into `W13N54` storage or terminal.

## Expected Implementation Shape

The current code already has:

- Mineral miners in `role.spawn.js` and `role.miner.js`
- Mineral hauling task execution in `role.lorry_mineral.js`
- Periodic mineral hauling assignment in `main.js`
- Room-specific oxygen storage behavior for `W14N53`
- A stale hard-coded lab reaction block in `main.js`

Likely implementation work:

1. Add a small room-specific UO stockpile controller for `W13N54`.
2. Move oxygen from `W14N53` storage to terminal, then send it to `W13N54` terminal as needed.
3. Load one `W13N54` input lab with `U`, another with `O`, and use the third lab as the `UO` output lab.
4. Run reactions until `W13N54` storage plus terminal contains at least `targetUO`.
5. Drain the output lab to storage or terminal.
6. Leave existing mineral hauling safeguards intact: exclude link-relay lorries and assign at most one idle empty lorry per mineral task/source.

## Done When

- `Documentation.md` records the final target calculation and current live constants.
- `W13N54` storage plus terminal contains at least the target amount of `UO`.
- `W13N54` reaction labs are not hoarding significant leftover `UO`, `U`, or `O` after the target is reached.
- Upload parity is verified after any bot code changes.
- Live console samples show the automation either completed or safely idle because the target is met.
- Any code change is committed with the required `Co-authored-by: Codex <noreply@openai.com>` trailer.

## Non-Goals

- Do not redesign the whole lab system.
- Do not optimize market trading.
- Do not convert other compounds.
- Do not change upgrade, builder, defender, or claim-to-build strategy except where narrowly required to keep UO logistics safe.

