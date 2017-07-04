module.exports = {
    // a function to run the logic for this role
  run: function(creep) {
        // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
            // switch state
      creep.memory.working = false;
      creep.memory.maxed = false;
      creep.memory.cycles++;
    }
        // if creep is harvesting energy but is full
    else if (creep.memory.working === false && (creep.carry.energy === creep.carryCapacity || creep.memory.maxed)) {
            // switch state
      creep.memory.working = true;
      creep.memory.steps_from_source = 0; // TODO: can get full from dropped energy too
      creep.memory.ticks_from_source = 0; // TODO: can get full from dropped energy too
    }

        // if creep is supposed to transfer energy to a structure
    if (creep.memory.working === true) {
            // if in home room
      if (creep.room.name === creep.memory.home) {
                // find closest spawn, extension or tower which is not full
        var structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    // the second argument for findClosestByPath is an object which takes
                    // a property called filter which can be a function
                    // we use the arrow operator to define it
          filter: (s) => ((s.structureType == STRUCTURE_SPAWN
                                 || s.structureType == STRUCTURE_EXTENSION
                                 || s.structureType == STRUCTURE_STORAGE
                                 || s.structureType == STRUCTURE_TOWER)
                                 && s.energy < s.energyCapacity)
                                 || (s.structureType == STRUCTURE_CONTAINER /* unloading into containers as well*/ && s.store[RESOURCE_ENERGY] < 2000)
        });

        if (structure == undefined) {
          structure = creep.room.storage;
        }

                // if we found one
        if (structure != undefined) {
                    // try to transfer energy, if it is not in range
          if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        // move towards it
            let m = creep.moveTo(structure);
            if (m === 0){
              creep.memory.steps_from_source++; // TODO: can get full from dropped energy too
            }
            creep.memory.ticks_from_source++; // TODO: can get full from dropped energy too
            creep.memory.miving_to_unload++; // cumulative
          }
        }
      }
            // if not in home room...
      else {
                // find exit to home room
        var exit = creep.room.findExitTo(creep.memory.home);
                // and move to exit
        creep.moveTo(creep.pos.findClosestByPath(exit));
        creep.memory.miving_to_unload++;
      }
    }
        // if creep is supposed to harvest energy from source
    else {
            // if in target room
      if (creep.room.name == creep.memory.target) {
                // find source
                // hledame spadlou energii na zemi
        let energy_dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: s => s.resourceType == RESOURCE_ENERGY && s.amount > 40
        });

        if (energy_dropped != undefined) {
          let l_result = creep.pickup(energy_dropped, RESOURCE_ENERGY);
          if (l_result == ERR_NOT_IN_RANGE) {
                        // move towards it
            creep.moveTo(energy_dropped);
            creep.memory.miving_to_source++;
            creep.say('EE');
          } else if (l_result !== 0){
            creep.say('Error ' + l_result);
          } else {
            creep.memory.mining++;
          }
        } else {

          var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                    //.find(FIND_SOURCES)[creep.memory.sourceIndex];

                    // try to harvest energy, if the source is not in range
          if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        // move towards the source
            creep.moveTo(source);
            creep.memory.miving_to_source++;
          } else {
            creep.memory.mining++;
          }
        }
      }
            // if not in target room
      else {
                // find exit to target room
        var exit = creep.room.findExitTo(creep.memory.target);
                // move to exit
        creep.moveTo(creep.pos.findClosestByPath(exit));
      }
    }
  }
};
