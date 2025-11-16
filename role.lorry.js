var roleLorryMineral = require('role.lorry_mineral');

module.exports = {
  // a function to run the logic for this role
  run: function (creep) {

    if (creep.memory._task) {
      roleLorryMineral.run(creep);
    } else {
      // if creep is bringing energy to a structure but has no energy left
      if (creep.memory.working === true && _.sum(creep.carry) === 0) {
        // switch state
        creep.memory.working = false;
        creep.memory.maxed = false;
      }
      // if creep is harvesting energy but is full
      else if (creep.memory.working === false && (_.sum(creep.carry) === creep.carryCapacity || creep.memory.maxed)) {
        // switch state
        creep.memory.working = true;
      }

      if (creep.memory._move && (creep.carry[RESOURCE_ENERGY] || 0) > 400 && !creep.memory.working && Game.time % 6 === 0) {
        let l_range = creep.pos.getRangeTo(creep.memory._move.dest.x, creep.memory._move.dest.y);
        /* if the range to another pickup is too long and we have enough energy (400), fuck it */
        if (l_range > 10) {
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
            && s.energy < s.energyCapacity)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity / 1.5)
        }) || creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (s) => (
            (s.structureType === STRUCTURE_TERMINAL && s.store && s.store[RESOURCE_ENERGY] < 10000) ||
            (s.structureType === STRUCTURE_NUKER && s.energy < s.energyCapacity && creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 50000)
          )
        }) //|| creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => (s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] < 100 && !_.some(Game.creeps, c => c.memory.role === 'miner' && c.pos.isEqualTo(s.pos))) })

        if (!structure && creep.room.storage) {
          creep.say('to_storage');
          structure = creep.room.storage;
        }

        //find builders working
        if (!structure) {
          structure = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (s) => (s.memory.role === 'builder' || s.memory.role === 'upgrader') && (s.carry[RESOURCE_ENERGY] < s.carryCapacity)
          });
        }
        if (!structure) {
          structure = creep.room.storage || creep.room.spawn;
        }
        if (structure) {
          creep.memory.kam_to_vezu = JSON.stringify(structure.pos);
        }

        // if we found one
        if (structure) {
          // try to transfer energy, if it is not in range
          if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            // move towards it
            creep.say('-->')
            return creep.moveTo(structure, { reusePath: 7, visualizePathStyle: { stroke: '#ff0000', lineStyle: null } });
          }
        }
      }
      // if creep is supposed to get energy
      else {
        // TODO transfer minerals ...

        // Prefer tombstones/ruins with energy (easy win). Try tombstones first, then ruins.
        let tombTarget = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
          filter: t => t.store && t.store[RESOURCE_ENERGY] > 50
        });
        if (!tombTarget) {
          tombTarget = creep.pos.findClosestByPath(FIND_RUINS, {
            filter: r => r.store && r.store[RESOURCE_ENERGY] > 50
          });
        }
        if (tombTarget) {
          let res = creep.withdraw(tombTarget, RESOURCE_ENERGY);
          if (res === ERR_NOT_IN_RANGE) {
            creep.moveTo(tombTarget, { reusePath: 7, visualizePathStyle: { stroke: '#ffaa00', lineStyle: 'dashed' } });
          } else if (res !== 0) {
            // fallback: try pickup (in case energy is on ground) or log
            let nearbyDrop = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 0 });
            if (nearbyDrop && _.sum(creep.carry) < creep.carryCapacity) {
              if (creep.pickup(nearbyDrop) === ERR_NOT_IN_RANGE) {
                creep.moveTo(nearbyDrop, { reusePath: 7 });
              }
            } else {
              // couldn't withdraw and nothing to pickup; move to tomb to retry next tick
              creep.moveTo(tombTarget, { reusePath: 7 });
            }
          }

          return;
        }

        // find closest container or LINK, with a lot of energy
        let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: s => (s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 1600)
        });

        // find closest container or LINK
        if (!container) {
          container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => ((s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 333)
              || (s.structureType === STRUCTURE_TERMINAL && s.store && s.store[RESOURCE_ENERGY] > 11000))
          });
        }
        // find closest container or LINK
        if (!container) {
          container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => ((s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 1200)
              || (s.structureType === STRUCTURE_STORAGE && s.store && s.store[RESOURCE_ENERGY] > 100000)
              || _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && c.pos.isEqualTo(s.pos) && s.energy > creep.carryCapacity))
          });
        }

        if (!container) {
          container = creep.room.storage;
        }

        // hledame spadlou energii na zemi - male kusy
        // ptame se jen jednou za 6 ticku
        let energy_dropped = null;
        let energy_dropped_huge = null;
        if (Game.time % 1 === 0) {
          energy_dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 440
          });

          energy_dropped_huge = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 500
          });
          if (energy_dropped_huge) {
            energy_dropped = energy_dropped_huge;
          } // nasli jsme vetsi kus energie na zemi, jedeme tam. Jinak se furt vracime k minerovi
        }

        if (energy_dropped) {
          let l_result = creep.pickup(energy_dropped);
          if (l_result === ERR_NOT_IN_RANGE) {
            // move towards it
            creep.moveTo(energy_dropped, { reusePath: 7, visualizePathStyle: { stroke: '#ffff00', lineStyle: 'dotted' } });
            creep.say('EE');
            return; // Do nothing else this tick
          } else if (l_result === -8) { // full
            creep.memory.maxed = true;
            creep.memory.working = true;
            creep.say('Maxed ' + l_result);
          } else if (l_result !== 0) {
            creep.say('Error ' + l_result);
          }
          // Try to withdraw from building if it is possible (STRUCTURE_CONTAINER, STRUCTURE_TERMINAL)
          if (energy_dropped.amount < creep.carryCapacity - _.sum(creep.carry) && l_result === 0) {
            let structOnTile = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, energy_dropped.pos.x, energy_dropped.pos.y), c => c.structureType === STRUCTURE_CONTAINER)[0];
            if (structOnTile) {
              let w = creep.withdraw(structOnTile, RESOURCE_ENERGY, creep.carryCapacity - _.sum(creep.carry) - energy_dropped.amount);
              if (w === 0) {
                console.log(creep.name, 'small pile: ', energy_dropped.amount, 'remaining cap:', creep.carryCapacity - _.sum(creep.carry) - energy_dropped.amount);
              } else {
                console.log(creep.name, 'ERROR withdraw', w, ' small pile at: ', structOnTile.pos, energy_dropped.amount, 'carry:', _.sum(creep.carry));
              }
            }
          }
        } else {
          // if one was found and we are not harvesting dropped energy
          if (container) {
            // try to withdraw energy, if the container is not in range
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              // move towards it
              creep.say('🚚->🏭');
              creep.moveTo(container, { reusePath: 7, visualizePathStyle: { stroke: '#ffff00', lineStyle: 'dashed' } });
            }
          }
        }
      }
    }
  }
};