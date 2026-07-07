# Implement: UO Stockpile Long Run

## Operating Instructions

Work from `/root/ScreepJandi`.

Before editing:

1. Read `Prompt.md`, `Plan.md`, and `Documentation.md`.
2. Run `git status --short`.
3. Preserve unrelated changes. Do not revert user work.
4. Reconfirm live constants and stock with short nonce-tagged console expressions.

During the run:

- Keep diffs scoped to the UO stockpile task.
- Update `Documentation.md` after each milestone, upload, monitor checkpoint, and material decision.
- If validation fails, fix it before moving to the next milestone.
- If a console expression times out, retry with a smaller expression before adding fields.
- Do not run Screeps console commands in parallel.

## Suggested Console Checks

Owned rooms:

```sh
npm run screeps:console -- --expr "(()=>{const nonce='uo-rooms-<unique>'; try { return JSON.stringify({nonce,time:Game.time,rooms:Object.keys(Game.rooms).filter(n=>Game.rooms[n].controller&&Game.rooms[n].controller.my)}); } catch(e) { return JSON.stringify({nonce,error:e.stack||String(e)}); }})()" --timeout 90000
```

Constants:

```sh
npm run screeps:console -- --expr "(()=>{const nonce='uo-constants-<unique>'; try { return JSON.stringify({nonce,time:Game.time,EXTRACTOR_COOLDOWN,LAB_REACTION_AMOUNT,REACTION_TIME_UO:REACTION_TIME[RESOURCE_UTRIUM_OXIDE],HARVEST_MINERAL_POWER}); } catch(e) { return JSON.stringify({nonce,error:e.stack||String(e)}); }})()" --timeout 90000
```

Per-room stock, replacing `<room>` and `<unique>`:

```sh
npm run screeps:console -- --expr "(()=>{const nonce='uo-<room>-stock-<unique>'; try { const r=Game.rooms['<room>']; const stock=o=>o?{U:o.store[RESOURCE_UTRIUM]||0,O:o.store[RESOURCE_OXYGEN]||0,UO:o.store[RESOURCE_UTRIUM_OXIDE]||0,energy:o.store[RESOURCE_ENERGY]||0}:null; const m=r.find(FIND_MINERALS)[0]; const c=m&&m.pos.findInRange(FIND_STRUCTURES,1,{filter:s=>s.structureType===STRUCTURE_CONTAINER})[0]; return JSON.stringify({nonce,time:Game.time,room:r.name,mineral:m&&{type:m.mineralType,amount:m.mineralAmount,regen:m.ticksToRegeneration},container:stock(c),storage:stock(r.storage),terminal:stock(r.terminal),terminalCooldown:r.terminal&&r.terminal.cooldown}); } catch(e) { return JSON.stringify({nonce,error:e.stack||String(e)}); }})()" --timeout 90000
```

`W13N54` labs:

```sh
npm run screeps:console -- --expr "(()=>{const nonce='uo-w13-labs-<unique>'; try { const r=Game.rooms['W13N54']; const labs=r.find(FIND_MY_STRUCTURES,{filter:s=>s.structureType===STRUCTURE_LAB}).map(l=>({id:l.id,x:l.pos.x,y:l.pos.y,mineralType:l.mineralType||null,amount:l.mineralAmount,energy:l.energy,cooldown:l.cooldown})); return JSON.stringify({nonce,time:Game.time,room:r.name,labs}); } catch(e) { return JSON.stringify({nonce,error:e.stack||String(e)}); }})()" --timeout 90000
```

Completion check:

```sh
npm run screeps:console -- --expr "(()=>{const nonce='uo-done-<unique>'; try { const r=Game.rooms['W13N54']; const labs=r.find(FIND_MY_STRUCTURES,{filter:s=>s.structureType===STRUCTURE_LAB}).map(l=>({id:l.id,mineralType:l.mineralType||null,amount:l.mineralAmount,cooldown:l.cooldown})); const storageUO=r.storage?(r.storage.store[RESOURCE_UTRIUM_OXIDE]||0):0; const terminalUO=r.terminal?(r.terminal.store[RESOURCE_UTRIUM_OXIDE]||0):0; return JSON.stringify({nonce,time:Game.time,storageUO,terminalUO,totalUO:storageUO+terminalUO,labs}); } catch(e) { return JSON.stringify({nonce,error:e.stack||String(e)}); }})()" --timeout 90000
```

## Target Calculation

Default calculation with 3.0 seconds per tick:

```sh
node -e "const secondsPerTick=3.0; const target=Math.ceil((3*24*60*60/secondsPerTick)*1/5); console.log(target)"
```

If you measure the tick rate during the run, update `Documentation.md` and use the measured value in the same formula.

## Implementation Guardrails

- Prefer explicit resource constants:
  - `RESOURCE_UTRIUM`
  - `RESOURCE_OXYGEN`
  - `RESOURCE_UTRIUM_OXIDE`
- Keep `W13N54` lab ids configurable in one small constant.
- Before assigning a lorry task, check for an existing compatible task or lorry already carrying that resource.
- Assign at most one idle empty lorry per transfer lane.
- Use existing `role.lorry_mineral.js` task behavior where possible.
- Do not revive the disabled broad `_.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), ...)` lab-loading block.
- Do not rely on stale hard-coded lab ids in the existing `LABS hardcoded` block without verifying them live.
- Do not create market orders or deals.

## Validation Commands

Run syntax checks for every changed root JavaScript file:

```sh
node --check main.js
node --check role.spawn.js
node --check role.lorry_mineral.js
```

Run upload checks:

```sh
npm run screeps:upload -- --dry-run --timeout 45000
npm run screeps:upload -- --timeout 45000
npm run screeps:upload -- --dry-run --timeout 45000
```

If the upload helper refuses intentional dirty root JavaScript files, use:

```sh
npm run screeps:upload -- --allow-dirty --timeout 45000
```

Document the reason in `Documentation.md`.

## Commit And Log

If code was uploaded and live behavior was verified, commit the relevant files only. Do not include unrelated local changes.

Commit message trailer:

```text
Co-authored-by: Codex <noreply@openai.com>
```

Append `/root/ScreepJandi/.screeps-code-change-actions.log` with:

- UTC timestamp
- requested goal
- files changed
- upload result
- monitoring duration and observations
- commit hash or reason no commit was created
- remaining blocker or risk

