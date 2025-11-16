/**
 * role.lorry_energy.js
 * Specialized creep for transferring energy between two adjacent rooms
 * Usage: Set creep.memory = {role: 'lorry_energy', sourceRoom: 'E7N32', destRoom: 'E7N33'}
 */

module.exports = {
  run: function(creep) {
    // Initialize memory if needed
    if (!creep.memory.sourceRoom || !creep.memory.destRoom) {
      creep.say('❌ no rooms');
      return;
    }

    const sourceRoom = creep.memory.sourceRoom;
    const destRoom = creep.memory.destRoom;

    // State machine: 'pickup' or 'dropoff'
    if (!creep.memory.state) {
      creep.memory.state = 'pickup';
    }

    // PICKUP PHASE: Get energy from source room storage
    if (creep.memory.state === 'pickup') {
      // If we're full, switch to dropoff
      if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.state = 'dropoff';
        creep.say('🚚');
      } else {
        // Move to source room if we're not there
        if (creep.room.name !== sourceRoom) {
          let exit = creep.room.findExitTo(sourceRoom);
          if (exit) {
            creep.moveTo(creep.pos.findClosestByRange(exit));
          }
        } else {
          // We're in the source room - find storage or container and withdraw
          let storage = creep.room.storage;
          let container = null;
          
          // If no storage, find a container with energy
          if (!storage) {
            container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
              filter: s => s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 0
            });
          }
          
          let target = storage || container;
          if (target && target.store.energy > 0) {
            let result = creep.withdraw(target, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
              creep.moveTo(target, {reusePath: 5});
            } else if (result !== 0) {
              creep.say('⚠️ ' + result);
            }
          } else {
            creep.say('💧 empty');
          }
        }
      }
    }
    // DROPOFF PHASE: Transfer energy to destination room storage
    else if (creep.memory.state === 'dropoff') {
      // If we're empty, switch back to pickup
      if (creep.carry.energy === 0) {
        creep.memory.state = 'pickup';
        creep.say('📦');
      } else {
        // Move to dest room if we're not there
        if (creep.room.name !== destRoom) {
          let exit = creep.room.findExitTo(destRoom);
          if (exit) {
            creep.moveTo(creep.pos.findClosestByRange(exit));
          }
        } else {
          // We're in the dest room - find storage or container and transfer
          let storage = creep.room.storage;
          let container = null;
          
          // If no storage, find a container with space
          if (!storage) {
            container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
              filter: s => s.structureType === STRUCTURE_CONTAINER && s.store && _.sum(s.store) < s.storeCapacity
            });
          }
          
          let target = storage || container;
          if (target) {
            let result = creep.transfer(target, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
              creep.moveTo(target, {reusePath: 5});
            } else if (result !== 0) {
              creep.say('⚠️ ' + result);
            }
          } else {
            creep.say('🏠 no store');
          }
        }
      }
    }
  }
};
