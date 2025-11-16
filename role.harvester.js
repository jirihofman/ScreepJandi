var roleBuilder = require('role.builder'); // builds things when there are constructionSites

module.exports = {
    // a function to run the logic for this role
    run: function (creep) {
        // === Activity tracking: last position and moved history (last 10 ticks) ===
        if (creep.name.startsWith('SlowUp1')) return creep.harvest(Game.getObjectById('59f1a22e82100e1594f3990a'))
        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working === true && creep.carry.energy === 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working === false && creep.carry.energy === creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working === true) {
            // find closest spawn, extension or tower which is not full
            var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
                filter: (s) => (s.structureType === STRUCTURE_SPAWN
                    || s.structureType === STRUCTURE_EXTENSION
                    || s.structureType === STRUCTURE_TOWER
                )
                    && s.energy < s.energyCapacity
            });

            if (!structure) {
                structure = creep.room.storage;
            }

            // if we found one
            if (structure) {
                // try to transfer energy, if it is not in range
                if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(structure);
                    creep.say('m' + JSON.stringify(structure))
                } else {
                    creep.say('h')
                }
            } else {
                if (creep.name.startsWith('Slow') || creep.name.startsWith('ssss')) {
                    var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        // move towards the source
                        creep.moveTo(source);
                    }
                } else {
                    // nowhere to put it, lets build/upgrade
                    roleBuilder.run(creep);
                }
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            // find closest source
            /* emergency: full towers, no creeps
      let t = creep.room.find(FIND_STRUCTURES, {filter: (c)=> c.structureType === STRUCTURE_TOWER && c.energy > 0})[0];
      if (t){
        if (creep.withdraw(t, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // move towards the source
          creep.moveTo(t);
        }
        return;
      }
      */
            var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

            if (!source) {
                source = creep.room.storage;
            }
            // hledame spadlou energii na zemi - male kusy
            let energy_dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 40
            });

            // TODO refactor. The same for long distance harvesting and lorries
            if (energy_dropped && creep.carry < creep.carryCapacity) {
                let l_result = creep.pickup(energy_dropped, RESOURCE_ENERGY);
                if (l_result === ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(energy_dropped);
                    creep.memory.miving_to_source++;
                    creep.say('EE');
                } else if (l_result !== 0) {
                    creep.say('Error ' + l_result);
                } else {
                    creep.memory.mining++;
                }
            } else {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    // move towards the source
                    creep.moveTo(source);
                }
            }
        }
    }
};
