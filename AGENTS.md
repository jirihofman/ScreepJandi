## Commit attribution

When creating commits for me, include this trailer at the end of the commit message:

Co-authored-by: Codex <noreply@openai.com>

## Screeps console commands

Use short, nonce-tagged Screeps console expressions. Large expressions and broad room dumps have repeatedly timed out or returned stale output from an earlier console command.

Observed failure modes:

- Long expressions that collect many creep, structure, path, and store fields can time out with `Timed out waiting for Screeps console result after 90000ms`.
- Parallel or back-to-back console calls can return stale results from a previous expression if the result is not uniquely identified.
- Expressions that throw before returning do not emit the expected marker result, so the local helper waits until timeout.

Console command rules:

- Prefer small single-purpose reads, for example road progress, container store, lorry tasks, or spawn state separately.
- Include a unique `nonce` in every returned JSON object and verify it before trusting the output.
- Wrap risky expressions in `try/catch` and return the error text as JSON instead of letting the console expression throw.
- Avoid full `Game.rooms` or full creep object dumps. Return compact arrays or selected scalar fields.
- Do not run multiple `npm run screeps:console` calls in parallel. Run them sequentially to avoid cross-reading stale socket messages.
- If a large read times out, retry with a minimal expression first, then add fields incrementally.

Example safe pattern:

```bash
npm run screeps:console -- --expr "(()=>{const nonce='w14-status-<unique>'; try { const r=Game.rooms['W14N53']; const sites=r.find(FIND_MY_CONSTRUCTION_SITES,{filter:s=>s.structureType===STRUCTURE_ROAD}); const c=r.lookForAt(LOOK_STRUCTURES,13,20).filter(s=>s.structureType===STRUCTURE_CONTAINER)[0]; return JSON.stringify({nonce,time:Game.time,roadSites:sites.length,roadProgress:_.sum(sites,s=>s.progress),containerO:c&&c.store.O}); } catch(e) { return JSON.stringify({nonce,error:e.stack||String(e)}); }})()" --timeout 90000
```

For monitoring W14N53 mineral work, first use minimal checks like:

```bash
npm run screeps:console -- --expr "(()=>{const r=Game.rooms['W14N53']; const sites=r.find(FIND_MY_CONSTRUCTION_SITES,{filter:s=>s.structureType===STRUCTURE_ROAD}); const c=r.lookForAt(LOOK_STRUCTURES,13,20).filter(s=>s.structureType===STRUCTURE_CONTAINER)[0]; return JSON.stringify({nonce:'w14-minimal-<unique>',time:Game.time,roadSites:sites.length,roadProgress:_.sum(sites,s=>s.progress),containerO:c&&c.store.O,storageO:r.storage&&r.storage.store.O});})()" --timeout 90000
```
