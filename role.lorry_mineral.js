module.exports = {
  // a function to run the logic for this role
  run: function (creep) {
    let l_creep_carry = _.sum(creep.carry);
    creep.say('[M]');
    // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working === true && l_creep_carry === 0) {
      // switch state
      creep.memory.working = false;
      creep.memory.maxed   = false;
    }
    // if creep is harvesting energy but is full
    else if (creep.memory.working === false && (l_creep_carry === creep.carryCapacity || creep.memory.maxed)) {
      // switch state
      creep.memory.working = true;
    }

    // if creep is supposed to transfer energy to a structure
    if (creep.memory.working) {
      // minerals go to storage
      let structure = Game.getObjectById(creep.memory._task.id_to) || creep.room.terminal || creep.room.storage;
      // if we found one
      if (structure) {
        // try to transfer energy, if it is not in range
        let t = creep.transfer(structure, creep.memory._task.mineral_type);
        if (t === ERR_NOT_IN_RANGE) {
          creep.moveTo(structure);  // move towards it
        } else if (t === 0) {
          console.log('Lorry switching back from task to energy mode.');
          delete creep.memory._task;
        }
      } else {
        console.log('Miner lorry has no target');
      }
    }
    // if creep is supposed to get energy
    else {
      // find closest container
      let container = Game.getObjectById(creep.memory._task.id_from);

      if (container) {
        // try to withdraw energy, if the container is not in range
        let w = creep.withdraw(container, creep.memory._task.mineral_type);
        if (w === ERR_NOT_IN_RANGE) {
          // move towards it
          creep.moveTo(container);
        } else if (w === 0) {
          creep.say('👍');
        } else {
          console.log('Error: ', w);
        }
      }
    }
  }
};
