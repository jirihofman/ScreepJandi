module.exports = {
    // a function to run the logic for this role
  run: function (creep) {
        // get source
    let source = Game.getObjectById(creep.memory.sourceId);
        // find container next to source
    if (!source) {return;}
    let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0];
    if (!container) {return;}
    // if creep is on top of the container
    if (creep.pos.isEqualTo(container.pos)) {
      // harvest source
      let h = creep.harvest(source);
      if (h === -11){
        if (source.mineralType){
          // cooldown on extractor maybe
          if (creep.carry[source.mineralType] < creep.carryCapacity){
            // try to withdraw from container
            creep.withdraw(container, source.mineralType);
          } else {
            // move the mineral to anything viable
            let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType===STRUCTURE_LAB})[0];
            creep.transfer(l_transfer_to, source.mineralType);
          }
        }
      } else if (h !== 0){
        console.log('error while harvesting source ', source, ' in room ', creep.room, '. Details: ', h);
      } else {
        // ENERGY miner
        if (container.store[RESOURCE_ENERGY] === container.storeCapacity){
          // move the mineral to anything viable
          let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>s.structureType===STRUCTURE_LINK && s.energy < s.energyCapacity})[0];
          creep.transfer(l_transfer_to, RESOURCE_ENERGY);
        }
      }
      if (source.energy === 0){
        creep.say(source.ticksToRegeneration);
      }
    }
        // if creep is not on top of the container
    else {
            // move towards it
      creep.moveTo(container);
    }
  }
};
