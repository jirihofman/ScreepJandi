module.exports = {
    // a function to run the logic for this role
  run: function(creep) {
        // if creep is bringing energy to the controller but has no energy left
    if (creep.memory.working && creep.carry.energy === 0) {
            // switch state
      creep.memory.working = false;
      creep.memory.maxed   = false;
    }
        // if creep is harvesting energy but is full
    else if (creep.memory.working === false && creep.carry.energy === creep.carryCapacity) {
            // switch state
      creep.memory.working = true;
    }

        // if creep is supposed to transfer energy to the controller
    if (creep.memory.working || creep.memory.maxed) {
            // instead of upgraderController we could also use:
            // if (creep.transfer(creep.room.controller, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    // if not in range, move towards the controller
        creep.moveTo(creep.room.controller);
      }
          // move the mineral to anything viable
      let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_TOWER && s.energy < 1000) || (s.structureType===STRUCTURE_SPAWN && s.energy < 300)})[0];
      creep.transfer(l_transfer_to, RESOURCE_ENERGY);
    }
            // if creep is supposed to get energy
    else {
            // find closest container
      let container = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_LINK && s.energy > 0)})[0]
       || creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_STORAGE) &&
                             s.store[RESOURCE_ENERGY] > 0
      });
            // if one was found
      if (container) {
                // try to withdraw energy, if the container is not in range
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(container);
        }
      }
      else {
                // find closest source
        var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                // try to harvest energy, if the source is not in range
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(source);
        }
      }
    }
  }
};
