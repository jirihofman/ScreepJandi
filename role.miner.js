module.exports = {
    // a function to run the logic for this role
  run: function (creep) {
        // get source
    let source = Game.getObjectById(creep.memory.sourceId);
    if (creep.memory.w13UtriumBoostedMiner && source && source.mineralType && source.mineralAmount < 10 && _.sum(creep.carry) === 0) {
      creep.memory.to_recycle = 1;
      creep.say('done');
      return;
    }

    if (source && source.mineralType && (creep.carry[source.mineralType] || 0) > 0) {
      const mineralContainer = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      })[0];
      if (mineralContainer) {
        if (creep.pos.isEqualTo(mineralContainer.pos)) {
          const transferResult = creep.transfer(mineralContainer, source.mineralType);
          if (transferResult !== OK && transferResult !== ERR_FULL) {
            console.log('error while unloading carried mineral before boost ', source.mineralType, ' in room ', creep.room, '. Details: ', transferResult);
          }
        } else {
          creep.moveTo(mineralContainer, { reusePath: 10, visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return;
      }
    }

    if (creep.memory.boostResource && source && source.mineralType) {
      const unboostedWorkParts = _.filter(creep.body, part => part.type === WORK && part.boost !== creep.memory.boostResource).length;
      if (unboostedWorkParts > 0) {
        const boostLab = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: s => s.structureType === STRUCTURE_LAB &&
            s.mineralType === creep.memory.boostResource &&
            (s.store[creep.memory.boostResource] || 0) >= unboostedWorkParts * LAB_BOOST_MINERAL &&
            (s.store[RESOURCE_ENERGY] || 0) >= unboostedWorkParts * LAB_BOOST_ENERGY
        });
        if (!boostLab) {
          creep.say('need boost');
          return;
        }
        if (!creep.pos.isNearTo(boostLab)) {
          creep.moveTo(boostLab, { reusePath: 10, visualizePathStyle: { stroke: '#66ccff' } });
          creep.say('boost');
          return;
        }
        const boostResult = boostLab.boostCreep(creep);
        if (boostResult === OK) {
          creep.say('boosted');
        } else if (boostResult !== ERR_BUSY) {
          creep.say('boost ' + boostResult);
        }
        return;
      }
      creep.memory.boosted = true;
    }

    if (creep.name === 'Miner2' || creep.name.startsWith('mmm')) creep.harvest(source);
        // find container next to source
    if (!source) {return;}
    let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0];
    if (!container) {
      if (source.mineralType) {
        creep.say('no cont');
        return;
      }
      // Try harvesting
      let h = creep.harvest(source);
      // if not close enough, move to source
      if (h === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      } else if (h !== OK && h !== ERR_BUSY) {
        console.log('error while harvesting source ', source, ' in room ', creep.room, '. Details: ', h);
      }
      return;
    }
    // if creep is on top of the container
    if (creep.pos.isEqualTo(container.pos)) {
      if (source.mineralType) {
        if (creep.memory.w13UtriumBoostedMiner) {
          const renewSpawn = creep.pos.findInRange(FIND_MY_SPAWNS, 1, {
            filter: s => s.store && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY)
          })[0];
          const adjacentLink = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_LINK && s.store && s.store[RESOURCE_ENERGY] > 0
          })[0];

          if ((creep.carry[RESOURCE_ENERGY] || 0) > 0 && renewSpawn) {
            const transferEnergy = creep.transfer(renewSpawn, RESOURCE_ENERGY);
            if (transferEnergy === OK || transferEnergy === ERR_FULL) {
              return;
            }
          }

          if (_.sum(creep.carry) === 0 && renewSpawn && adjacentLink) {
            const withdrawEnergy = creep.withdraw(adjacentLink, RESOURCE_ENERGY);
            if (withdrawEnergy === OK) {
              return;
            }
          }
        }

        const mineralType = source.mineralType;
        if ((creep.carry[mineralType] || 0) > 0) {
          const t = creep.transfer(container, mineralType);
          if (t === ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
          } else if (t !== OK && t !== ERR_FULL) {
            console.log('error while transferring mineral ', mineralType, ' to container ', container, ' in room ', creep.room, '. Details: ', t);
          }
          return;
        }

        let h = creep.harvest(source);
        if (h === ERR_TIRED) {
          creep.say('cooldown');
        } else if (h === ERR_NOT_ENOUGH_RESOURCES) {
          creep.say(source.ticksToRegeneration || 'empty');
        } else if (h === ERR_FULL) {
          const t = creep.transfer(container, mineralType);
          if (t !== OK && t !== ERR_FULL) {
            console.log('error while unloading full mineral miner ', creep, ' in room ', creep.room, '. Details: ', t);
          }
        } else if (h !== OK && h !== ERR_BUSY) {
          console.log('error while harvesting mineral ', source, ' in room ', creep.room, '. Details: ', h);
        }
        return;
      }
      // harvest source
      let h = creep.harvest(source);
      if (h === -11){
        /* MINERAL */
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
      } else if (h !== 0 && h !== -6){
        console.log('error while harvesting source ', source, ' in room ', creep.room, '. Details: ', h);
      } else {
        // ENERGY miner
        if (Game.time % 5 === 0){
          // move the mineral to anything viable
          let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_TOWER && s.energy < 1000) || (s.structureType===STRUCTURE_SPAWN && s.energy < 300)})[0];
          if (!l_transfer_to){
            l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_LINK && s.energy < s.energyCapacity) || (s.structureType===STRUCTURE_TOWER && s.energy < 1000)})[0];
          }

          creep.transfer(l_transfer_to, RESOURCE_ENERGY);
        }
        if (container.store[RESOURCE_ENERGY] >= 0 && Game.time % 4 === 0){
          creep.withdraw(container, RESOURCE_ENERGY);
          let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_TOWER && s.energy < 1000) || (s.structureType===STRUCTURE_SPAWN && s.energy < 300)})[0];
          if (!l_transfer_to){
            l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_LINK && s.energy < s.energyCapacity) || (s.structureType===STRUCTURE_TOWER && s.energy < 1000)})[0];
          }
          creep.transfer(l_transfer_to, RESOURCE_ENERGY);
        }
      }
      if (source.energy === 0){
        creep.say(source.ticksToRegeneration);
      }
    }
    // if creep is not on top of the container
    else {
      creep.moveTo(container);
    }
  }
};
