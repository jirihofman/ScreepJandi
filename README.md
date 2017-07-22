# ScreepJandi

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

# Lairs
## Patrol
25 move, 6 heal, rest attack
