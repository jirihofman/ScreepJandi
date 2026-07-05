const staticUpgraderStations = {
  W13N54: { x: 35, y: 12 },
  W14N53: { x: 32, y: 18 }
};

const getStaticUpgraderStation = function (creep) {
  const station = staticUpgraderStations[creep.room.name];
  if (!station || creep.memory.role !== 'upgrader' || creep.name.indexOf('StaticUpgrader-' + creep.room.name + '-') !== 0) {
    return null;
  }
  return new RoomPosition(station.x, station.y, creep.room.name);
};

const findAdjacentStaticEnergy = function (creep) {
  return creep.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => (
      (s.structureType === STRUCTURE_LINK && s.energy > 0) ||
      ((s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_TERMINAL || s.structureType === STRUCTURE_CONTAINER) &&
        s.store && s.store[RESOURCE_ENERGY] > 0)
    )
  })[0];
};

const runStaticUpgrader = function (creep, station) {
  if (creep.pos.getRangeTo(station) > 1 || creep.pos.getRangeTo(creep.room.controller) > 3) {
    creep.moveTo(station, { reusePath: 3, visualizePathStyle: { stroke: '#ffaa00' } });
    creep.upgradeController(creep.room.controller);
    creep.say('⚡ upgrade');
    return;
  }

  if (creep.carry.energy > 0) {
    creep.upgradeController(creep.room.controller);
    creep.say('⚡ upgrade');
  }

  if (creep.carry.energy < creep.carryCapacity) {
    const adjacentEnergy = findAdjacentStaticEnergy(creep);
    if (adjacentEnergy) {
      creep.withdraw(adjacentEnergy, RESOURCE_ENERGY);
    } else if (creep.carry.energy === 0) {
      creep.say('🕓 energy');
    }
  }
};

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

    const staticStation = getStaticUpgraderStation(creep);
    if (staticStation) {
      runStaticUpgrader(creep, staticStation);
      return;
    }

        // if creep is supposed to transfer energy to the controller
    if (creep.memory.working || creep.memory.maxed) {
      /* when lvl8 */
      if (Memory.rooms && Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].upgradeSpot){
        if (creep.pos.x !== Memory.rooms[creep.room.name].upgradeSpot.x || creep.pos.y !== Memory.rooms[creep.room.name].upgradeSpot.y){
          let a = creep.moveTo(Memory.rooms[creep.room.name].upgradeSpot.x, Memory.rooms[creep.room.name].upgradeSpot.y);
          creep.upgradeController(creep.room.controller) // try upgrading on the move
          creep.say('⚡ upgrade');
          return;
        } else {
          creep.upgradeController(creep.room.controller) // try upgrading on the move
          creep.say('⚡ upgrade');
          if (creep.carry.energy < 60){
            // if next to link or storage, withdraw energy
            l_vedle = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_LINK && s.energy > 0)})[0];
            if (!l_vedle)
              l_vedle = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > creep.carryCapacity)})[0];
            if (l_vedle)
              creep.withdraw(l_vedle, RESOURCE_ENERGY)
          }

          if (creep.carry.energy > 100){
            // move the mineral to anything viable
            let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_TOWER && s.energy < 1000) || (s.structureType===STRUCTURE_SPAWN && s.energy < 300)})[0];
            creep.transfer(l_transfer_to, RESOURCE_ENERGY);
          }
          return;
        }

        /* when below lvl8 */
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
          creep.say('⚡ upgrade');
        }
      }

      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      } else {
        creep.say('⚡ upgrade');
      }
      // move the mineral to anything viable
      let l_transfer_to = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_TOWER && s.energy < 1000) || (s.structureType===STRUCTURE_SPAWN && s.energy < 300)})[0];
      creep.transfer(l_transfer_to, RESOURCE_ENERGY);
    }
            // if creep is supposed to get energy
    else {
            // prefer nearby high-stock storage over miner containers
      let container = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_LINK && s.energy > 0)})[0]
       || (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > creep.carryCapacity && creep.pos.getRangeTo(creep.room.storage) <= 3 && creep.room.storage)
       || creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                             s.store[RESOURCE_ENERGY] > 0
      });
            // if one was found
      if (container) {
                // try to withdraw energy, if the container is not in range
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(container);
        } else {
          creep.say('📥 energy');
        }
      }
      else {
                // find closest source
        var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                // try to harvest energy, if the source is not in range
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(source);
        } else {
          creep.say('⛏ harvest');
        }
      }
    }
  }
};
