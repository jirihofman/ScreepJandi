module.exports = {
  // a function to run the logic for this role
  run: function (creep) {
    const restoreTaskState = function (creep, l_task) {
      if (l_task) {
        if (typeof l_task.restoreWorking === 'boolean') {
          creep.memory.working = l_task.restoreWorking;
        }
        if (typeof l_task.restoreMaxed === 'boolean') {
          creep.memory.maxed = l_task.restoreMaxed;
        }
      }
      delete creep.memory._task;
      return;
    };

    const l_task = creep.memory._task;
    const l_task_timeout = 200;
    const l_source_idle_timeout = 10;
    if (l_task) {
      if (!l_task.startTick) {
        l_task.startTick = Game.time;
      } else if (Game.time - l_task.startTick >= (l_task.timeout || l_task_timeout)) {
        console.log('Miner lorry task timeout, reverting to normal mode:', creep.name);
        restoreTaskState(creep, l_task);
        return;
      }
    }

    let l_creep_carry = _.sum(creep.carry);
    if (!l_task) {
      return;
    }
    creep.say('[M]' + l_task.mineral_type);

    const clearSourceIdle = function () {
      delete l_task.sourceIdleSince;
    };

    const stopIfSourceIdleTooLong = function () {
      if (!l_task.sourceIdleSince) {
        l_task.sourceIdleSince = Game.time;
      }
      if (Game.time - l_task.sourceIdleSince >= (l_task.sourceIdleTimeout || l_source_idle_timeout)) {
        console.log('Miner lorry source idle timeout, reverting to normal mode:', creep.name, l_task.mineral_type);
        restoreTaskState(creep, l_task);
        return true;
      }
      return false;
    };

    // custom flow for terminal->storage moves (does withdraw before transfer cycle)
    if (l_task && l_task.mode === 'terminal_to_storage') {
      if (!l_task.phase) {
        l_task.phase = 'withdraw';
      }

      if (l_task.phase === 'withdraw') {
        let container = Game.getObjectById(l_task.id_from);
        let l_amount = creep.carryCapacity - _.sum(creep.carry);
        const useExplicitAmount = !!l_task.amount;
        if (l_task.amount) {
          l_amount = Math.max(0, Math.min(l_task.amount - _.sum(creep.carry), l_amount));
        }

        if (container) {
          const w = useExplicitAmount ? creep.withdraw(container, l_task.mineral_type, l_amount) : creep.withdraw(container, l_task.mineral_type);
          if (w === ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
          } else if (w === 0) {
            l_task.phase = 'transfer';
            creep.say('👍');
          } else if (w === ERR_FULL) {
            // carry already full, move that energy to storage first
            l_task.phase = 'transfer';
          } else if (w === ERR_NOT_ENOUGH_RESOURCES) {
            if (l_creep_carry > 0) {
              l_task.phase = 'transfer';
            } else {
              console.log('Miner lorry has no source energy');
              restoreTaskState(creep, l_task);
              return;
            }
          } else {
            console.log('Error mineral lorry: ', w, l_amount, l_task.mineral_type);
          }
        } else {
          console.log('Miner lorry has no source');
          restoreTaskState(creep, l_task);
        }

        return;
      }

      if (l_task.phase === 'transfer') {
        let structure = Game.getObjectById(l_task.id_to) || creep.room.storage;
        if (!structure) {
          console.log('Miner lorry has no target');
          restoreTaskState(creep, l_task);
          return;
        }

        const t = creep.transfer(structure, l_task.mineral_type);
        if (t === ERR_NOT_IN_RANGE) {
          creep.moveTo(structure);
        } else if (t === 0) {
          l_creep_carry = _.sum(creep.carry);
          if (l_creep_carry > 0) {
            l_task.phase = 'transfer';
            return;
          }
          if (l_task.once) {
            console.log('Lorry switching back from task to energy mode.');
            restoreTaskState(creep, l_task);
          } else {
            l_task.phase = 'withdraw';
          }
        } else {
          console.log('Error mineral lorry: ', t, l_task.mineral_type);
          const l_carry_now = _.sum(creep.carry);
          if (t === ERR_FULL) {
            restoreTaskState(creep, l_task);
          } else if (t === ERR_NOT_ENOUGH_RESOURCES) {
            if (l_carry_now > 0) {
              l_task.phase = 'withdraw';
            } else {
              restoreTaskState(creep, l_task);
            }
          } else {
            restoreTaskState(creep, l_task);
          }
        }
      }

      return;
    }

    // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working === true && l_creep_carry === 0) {
      // switch state
      creep.memory.working = false;
      creep.memory.maxed   = false;
    }
    // if creep is harvesting energy but is full
    else if (creep.memory.working === false && (l_creep_carry > 5 || creep.memory.maxed)) {
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
          restoreTaskState(creep, l_task);
        }
      } else {
        console.log('Miner lorry has no target');
      }
    }
    // if creep is supposed to get energy
    else {
      // find closest container
      let container = Game.getObjectById(creep.memory._task.id_from);
      let l_amount = creep.carryCapacity - l_creep_carry;
      if (creep.memory._task && creep.memory._task.amount){
          l_amount = Math.min(creep.memory._task.amount, l_amount);
      }

      if (container) {
        const l_available = container.store && (container.store[creep.memory._task.mineral_type] || 0);
        if (l_available <= 0) {
          stopIfSourceIdleTooLong();
          return;
        }
        l_amount = Math.min(l_amount, l_available);
        // try to withdraw energy, if the container is not in range
        let w = creep.withdraw(container, creep.memory._task.mineral_type, l_amount);
        if (w === ERR_NOT_IN_RANGE) {
          clearSourceIdle();
          // move towards it
          creep.moveTo(container);
        } else if (w === 0) {
          clearSourceIdle();
          creep.say('👍');
        } else if (w === ERR_NOT_ENOUGH_RESOURCES) {
          if (l_creep_carry > 0) {
            creep.memory.working = true;
            clearSourceIdle();
          } else {
            stopIfSourceIdleTooLong();
          }
        } else {
          console.log('Error mineral lorry: ', w, l_amount, creep.memory._task.mineral_type);
        }
      } else {
        restoreTaskState(creep, l_task);
      }
    }
  }
};
