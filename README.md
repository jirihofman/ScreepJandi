# ScreepJandi

## memory play (TODO)

### Spawn

1. **energy_deflator** - reduce the energy amount that is used for building creeps. Default 0.

### Creep (all types)

1. **to_recycle**
  1. **1**: go to spawn in the same room and get recycled by it
1. **maxed**: if *true*, creep stops harvesting/collecting energy and goes to work (harvest, repair, build, upgrade, lorry)

#### longDistanceHarvester

1. steps_from_source - tiles traveled from source to unload. One way only
1. ticks_from_source - time traveled from source to unload. One way only
1. **miving_to_unload** - total time moving from energy to unload
