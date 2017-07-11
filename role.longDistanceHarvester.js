var roleBuilder = require('role.builder');

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
      creep.memory.maxed = false;
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
          filter: (s) => ((s.structureType === STRUCTURE_SPAWN
                                 || s.structureType === STRUCTURE_EXTENSION
                                 || s.structureType === STRUCTURE_STORAGE
                                 || s.structureType === STRUCTURE_TOWER)
                                 && s.energy < s.energyCapacity)
                                 || (s.structureType === STRUCTURE_CONTAINER /* unloading into containers as well*/ && s.store[RESOURCE_ENERGY] < 2000)
        });

        if (!structure) {
          structure = creep.room.storage;
        }

                // if we found one
        if (structure) {
                    // try to transfer energy, if it is not in range
          if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
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
        if (creep.room.name === creep.memory.target){
          /* if LDH is in target room and there are roads to be built, build them */
          let l_roads_to_build = creep.room.find(FIND_CONSTRUCTION_SITES)[0];
          if (l_roads_to_build){
            roleBuilder.run(creep);
            creep.say('LDH->B');
            return;
          }
        }
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
      if (creep.room.name === creep.memory.target) {
                // find source
                // hledame spadlou energii na zemi
        let energy_dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 40
        });

        if (energy_dropped) {
          let l_result = creep.pickup(energy_dropped, RESOURCE_ENERGY);
          if (l_result === ERR_NOT_IN_RANGE) {
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

          var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE) || creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];
                    //.find(FIND_SOURCES)[creep.memory.sourceIndex];

          /* Takes too long to replenish the source, head back and unload */
          if (source && source.energy === 0 && source.ticksToRegeneration > 130){
            console.log('Head back with ', creep.carry.energy, ' energy, it will take ', source.ticksToRegeneration, ' to regenerate');
            creep.memory.maxed = true;
          }

          // try to harvest energy, if the source is not in range
          let h = creep.harvest(source);
          if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
            // move towards the source
            creep.moveTo(source);
            if (creep.pos.y === 0){
              // could get stuck when next move was to the left/right and was thrown back to exit
              creep.move(BOTTOM);
            }
            creep.memory.miving_to_source++;
          } else {
            creep.memory.mining++;
          }
        }
      }
      // if not in target room
      else {
        // find exit to target room
        let exit = creep.room.findExitTo(creep.memory.target);
        // move to exit
        creep.moveTo(creep.pos.findClosestByPath(exit));
      }
    }

    /* if creep lost the working parts, put it down */
    /* TODO: refactor and put it in Creep prototype */
    if (_.sum(creep.body, c => c.type === 'work' && c.hits > 0) === 0){
      creep.memory.to_recycle = 1;
    }
  }
};
