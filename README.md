# ScreepJandi

## Development
1. open repo in VSCode
1. run nodemon to copy from repo to Screeps
```sh
nodemon --watch . --ext js --exec "cp -r ./*.js /Users/jirihofman/Library/Application\ Support/Screeps/scripts/screeps.com/ScreepJandi"
```

## Memory play (WiP)

### Spawn

1. **energy_deflator** - reduce the energy amount that is used for building creeps. Default 0.
1. **minBuilders** - minimum number of builders in a room where spawn is
1. **minRepairers** - minimum number of repairers in a room where spawn is
1. **claimRoom** - when exists, spawns role: *claimer*

### Creep (all types)

1. **to_recycle**
   1. **1**: go to spawn in the same room and get recycled by it
1. **maxed**: if *true*, creep stops harvesting/collecting energy and goes to work (harvest, repair, build, upgrade, lorry)

#### builder

1. **ext** - when **true**, withdraws energy from extensions as well. Usually used around RCL 4 for storage building.

#### longDistanceHarvester

1. steps_from_source - tiles traveled from source to unload. One way only
1. ticks_from_source - time traveled from source to unload. One way only
1. **miving_to_unload** - total time moving from energy to unload

#### lorry

1. **_task**
   1. *id_to*: Where does it unload
   1. *id_from*: Optional. From where withdraw resources
   1. *mineral_type*: RESOURCE_*

## Flag play (WiP)

### Yellow
Used for LINKs. Transfering from **yellow-red** to **yellow-yellow**.

### Brown
Used for role **repairer** to recycle constructions. When a repairer sees this flag, it dismantles it.

### Tower big-only (COLOR_BLUE + COLOR_BLUE)
Place a flag with both primary and secondary colors set to `COLOR_BLUE` in a room to enable tower "big-only" mode.
When present, towers will only target hostile creeps with more than 3 body parts. This prevents multiple towers from focusing fire on tiny 1-3 body-part creeps.

### Scout

Spawn with memory: { role: 'scout', target: 'W13N55', pos: { x: 25, y: 25 } }

- If `pos` is provided, the scout will move to the exact position and stay there (useful for observation).
- If `target` (room name) is provided, the scout will travel there first and then go to `pos` (if given).
- If `pos` is omitted but `target` is provided, the scout will go to the room center (25,25) and idle there.

### Claim-to-Build (COLOR_PURPLE + COLOR_PURPLE)

Place a flag with both primary and secondary colors set to `COLOR_PURPLE` in a room to initiate comprehensive claim-to-build logic.

The system will automatically:
1. Select a source room/spawn to produce necessary creeps
2. Claim the room (if not yet claimed)
3. Create initial miner (5x WORK, 1-2 MOVE) to bootstrap the room
4. Upgrade controller to level 2
5. Build container next to energy source
6. Build extensions (as RCL allows)
7. Build spawn 2 squares from energy source
8. Create permanent miner (5x WORK, positioned between source and spawn for renewal)
9. When RCL reaches 3: place tower
10. When RCL reaches 4: place storage

The flag is removed once the operation is initialized and tracked in Memory.claimToBuild.

# Lairs (TODO)
## Patrol
25 move, 6 heal, rest attack

## Hit Squad

A coordinated combat system that creates and manages squads of 1-4 combat creeps working together.

### Features

- **Variable squad size**: Automatically determines 1-4 creeps based on body parts budget
- **Balanced composition**: Mix of TOUGH, ATTACK, RANGED_ATTACK, HEAL, and MOVE parts
- **Coordinated deployment**: Squad waits for all members before moving to target
- **Smart retreat**: Returns home when target is clear or squad is outmatched
- **Auto-recycling**: Recycles at spawn when mission complete

### Usage

Create a hit squad using the spawn prototype:

```javascript
// Create a squad with 150 total body parts targeting room W1N1
const squadId = Game.spawns.Spawn1.createHitSquad('W1N1', null, 150);

// Create a squad targeting a specific creep
const squadId = Game.spawns.Spawn1.createHitSquad('W1N1', 'EnemyCreepName', 120);
```

### Parameters

- `targetRoom` (string): Room name to attack
- `targetCreep` (string|null): Optional specific creep name to eliminate
- `totalBodyParts` (number): Total body parts budget (e.g., 150)

### Squad Behavior

1. **Spawning**: Squad manager spawns creeps one by one
2. **Ready**: All members wait near spawn until squad is complete
3. **Deployed**: Move together to target room and engage hostiles
4. **Retreating**: Return home when:
   - Target creep eliminated
   - Target room clear of hostiles
   - Squad outnumbered (hostile power > 1.5x squad power)
5. **Recycling**: Squad members recycle at spawn

### Memory Structure

Squad data is stored in `Memory.squads[squadId]`:

```javascript
{
  name: 'fooooo',           // Random squad name
  spawnName: 'Spawn1',      // Spawn used
  targetRoom: 'W1N1',       // Target room
  targetCreep: null,        // Optional target creep
  status: 'deployed',       // spawning|ready|deployed|retreating
  members: ['fooooo-1', 'fooooo-2'],  // Member names
  composition: {...},       // Body composition data
  createdTime: 12345       // Game time when created
}
```
