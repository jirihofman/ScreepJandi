var roleLorryMineral = require('role.lorry_mineral');

module.exports = {
    // a function to run the logic for this role
  run: function (creep) {

    if (Game.time % 5 === 0){
      console.log('Skipping LORRY tick');
      return;
    }
    if (creep.memory._task){
      roleLorryMineral.run(creep);
    } else {
      // if creep is bringing energy to a structure but has no energy left
      if (creep.memory.working === true && _.sum(creep.carry) === 0) {
              // switch state
        creep.memory.working = false;
        creep.memory.maxed   = false;
      }
          // if creep is harvesting energy but is full
      else if (creep.memory.working === false && (_.sum(creep.carry) === creep.carryCapacity || creep.memory.maxed)) {
              // switch state
        creep.memory.working = true;
      }

      if (creep.memory._move && creep.carry.energy > 400 && !creep.memory.working){
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
          filter: (s) => ((s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION)
                               && s.energy < Number(s.energyCapacity))
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity/2)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_TERMINAL && s.store[RESOURCE_ENERGY] < 10000)
        });

        if (!structure && creep.room.storage && creep.room.storage.isActive()) {
          creep.say('to_storage');
          structure = creep.room.storage;
        }

        //find builders working
        if (!structure) {
          structure = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (s) => (s.memory.role === 'builder' || s.memory.role === 'upgrader') && (s.carry.energy < s.carryCapacity)
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
            creep.moveTo(structure, {reusePath: 7, visualizePathStyle: {stroke: '#ffff00', lineStyle: null}});
          }
        }
      }
      // if creep is supposed to get energy
      else {
        // TODO transfer minerals ...


        // find closest container or LINK, with a lot of energy
        let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: s => (s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1600)
            //|| _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && c.pos.isEqualTo(s.pos) && s.energy > creep.carryCapacity)
        });

        // find closest container or LINK
        if (!container) {
          container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 999)
            || (s.structureType === STRUCTURE_TERMINAL && s.store[RESOURCE_ENERGY] > 11000) /* taking energy from storage if there is plenty */
            //|| _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && c.pos.isEqualTo(s.pos) && s.energy > creep.carryCapacity)
          });
        }
        // find closest container or LINK
        if (!container) {
          container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 10)
            || (s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 100000) /* taking energy from storage if there is plenty */
            || _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && c.pos.isEqualTo(s.pos) && s.energy > creep.carryCapacity)
          });
        }

        if (!container) {
          container = creep.room.storage;
        }

        // hledame spadlou energii na zemi - male kusy
        let energy_dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 40
        });

        let energy_dropped_huge = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 600
        });
        if (energy_dropped_huge)
          {energy_dropped = energy_dropped_huge;} // nasli jsme vetsi kus energie na zemi, jedeme tam. Jinak se furt vracime k minerovi

        if (energy_dropped) {
          let l_result = creep.pickup(energy_dropped, RESOURCE_ENERGY);
          if (l_result === ERR_NOT_IN_RANGE) {
            // move towards it
            creep.moveTo(energy_dropped, {reusePath: 7, visualizePathStyle: {stroke: '#ffff00', lineStyle: 'dotted'}});
            creep.say('EE');
          } else if (l_result !== 0){
            creep.say('Error ' + l_result);
          }
          // Try to withdraw from building if it is possible (STRUCTURE_CONTAINER, STRUCTURE_TERMINAL)
          if (energy_dropped.amount < creep.carryCapacity-creep.carry.energy && l_result === 0){
            let w = creep.withdraw(_.filter(creep.room.lookForAt(LOOK_STRUCTURES, energy_dropped.pos.x, energy_dropped.pos.y), c=>c.structureType===STRUCTURE_CONTAINER)[0], RESOURCE_ENERGY, creep.carryCapacity-creep.carry.energy-energy_dropped.amount);
            if (w===0){
              console.log(creep, 'small pile: ', energy_dropped.amount, creep.carryCapacity-creep.carry.energy-energy_dropped.amount);
            } else {
              console.log(creep, 'ERROR', w, ' small pile: ', creep.room.lookForAt(LOOK_STRUCTURES, energy_dropped)[0], energy_dropped.amount, creep.carryCapacity-creep.carry.energy, creep.carryCapacity, creep.carry.energy);
            }
          }
        } else {
          // if one was found and we are not harvesting dropped energy
          if (container) {
            // try to withdraw energy, if the container is not in range
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              // move towards it
              creep.say('🚚->🏭');
              creep.moveTo(container, {reusePath: 7, visualizePathStyle: {stroke: '#ffff00', lineStyle: 'dashed'}});
            }
          }
        }
      }
    }
  }
};
