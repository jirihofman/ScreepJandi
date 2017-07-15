var roleLorryMineral = require('role.lorry_mineral');

module.exports = {
    // a function to run the logic for this role
  run: function (creep) {
    if (creep.memory._task && (creep.carry.energy === 0 || creep.memory._task.mineral_type === RESOURCE_ENERGY)){
      roleLorryMineral.run(creep);
    } else {
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

      if (creep.carry.energy > 400 && !creep.memory.working){
        let l_range = creep.pos.getRangeTo(creep.memory._move.dest.x, creep.memory._move.dest.y);
        /* if the range to another pickup is too long and we have enough energy (400), fuck it */
        if (l_range > 20){
          creep.memory.working = true;
          console.log('Lory move from ', JSON.stringify(creep.pos), ' to ', JSON.stringify(creep.memory._move.dest), '. Range: ', l_range);
        }
      }

      // if creep is supposed to transfer energy to a structure
      if (creep.memory.working) {
        /* TODO: in case of attack, switch priorities. Towers fill first */
        // find closest spawn, extension or tower which is not full
        var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                  // the second argument for findClosestByPath is an object which takes
                  // a property called filter which can be a function
                  // we use the arrow operator to define it
          filter: (s) => ((s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION)
                               && s.energy < s.energyCapacity)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                  // the second argument for findClosestByPath is an object which takes
                  // a property called filter which can be a function
                  // we use the arrow operator to define it
          filter: (s) => (s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity/2)
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
          structure = creep.room.storage || creep.room.spawn;
        }
        if (structure)
                {creep.memory.kam_to_vezu = JSON.stringify(structure.pos);}

              // if we found one
        if (structure) {
                  // try to transfer energy, if it is not in range
          if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                      // move towards it
            creep.moveTo(structure, {reusePath: 10});
          }
        }
      }
      // if creep is supposed to get energy
      else {
        // TODO transfer minerals ...


        // find closest container or LINK
        let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: s => (s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0)
            || _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && c.pos.isEqualTo(s.pos) && s.energy > creep.carryCapacity)
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
              creep.moveTo(container, {reusePath: 10});
            }
          }
        }
      }
    }
  }
};
