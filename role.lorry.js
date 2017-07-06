module.exports = {
    // a function to run the logic for this role
  run: function (creep) {
        // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
            // switch state
      creep.memory.working = false;
      creep.memory.maxed   = false;
    }
        // if creep is harvesting energy but is full
    else if (creep.memory.working === false && (creep.carry.energy === creep.carryCapacity || creep.memory.maxed)) {
            // switch state
      creep.memory.working = true;
    }

        // if creep is supposed to transfer energy to a structure
    if (creep.memory.working) {
            // find closest spawn, extension or tower which is not full
      var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
        filter: (s) => ((s.structureType === STRUCTURE_SPAWN
                             || s.structureType === STRUCTURE_EXTENSION
                             || s.structureType === STRUCTURE_STORAGE)
                             && s.energy < s.energyCapacity)
      }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
        filter: (s) => (s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity)
      });

      if (!structure) {
        creep.say('to_storage');
        structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    // the second argument for findClosestByPath is an object which takes
                    // a property called filter which can be a function
                    // we use the arrow operator to define it
          filter: (s) => s.structureType === STRUCTURE_STORAGE
        });
      }

      if (!structure) {
        structure = creep.room.storage;
      }
      if (structure)
              {creep.memory.kam_to_vezu = JSON.stringify(structure.pos);}

            // if we found one
      if (structure) {
                // try to transfer energy, if it is not in range
        if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(structure);
        }
      }
    }
        // if creep is supposed to get energy
    else {
            // find closest container
      let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
      });

      if (!container) {
        container = creep.room.storage;
      }

            // hledame spadlou energii na zemi - male kusy
      let energy_dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 40
      });

      let energy_dropped_huge = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 1000
      });
      if (energy_dropped_huge)
        {energy_dropped = energy_dropped_huge;} // nasli jsme vetsi kus energie na zemi, jedeme tam. Jinak se furt vracime k minerovi

      if (energy_dropped) {
        let l_result = creep.pickup(energy_dropped, RESOURCE_ENERGY);
        if (l_result === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(energy_dropped);
          creep.say('EE');
        } else if (l_result !== 0){
          creep.say('Error ' + l_result);
        }
      } else {
                // if one was found and we are not harvesting dropped energy
        if (container) {
                    // try to withdraw energy, if the container is not in range
          if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        // move towards it
            creep.moveTo(container);
          }
        }
      }

    }
  }
};
