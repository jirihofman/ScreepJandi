const roomUpgradeMode = require('room.upgradeMode');

const roomBuilderOverrides = {
  'W13N54': {
	    spawnName: 'Spawn11',
	    body: [
	      WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
	      WORK, WORK, WORK, WORK, WORK,
	      CARRY, CARRY, CARRY, CARRY, CARRY,
	      MOVE, MOVE, MOVE, MOVE, MOVE
    ],
    directions: [LEFT]
  },
  'W14N53': {
	    spawnName: 'Spawn55',
	    body: [
	      WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
	      WORK, WORK, WORK, WORK, WORK,
	      CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
	      CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
	      MOVE, MOVE, MOVE, MOVE, MOVE
    ],
    directions: [BOTTOM]
  }
};

const roomUpgraderOverrides = {
  'W13N54': {
    body: [
      WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
      WORK, WORK, WORK, WORK, WORK,
      CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE, MOVE, MOVE, MOVE
    ],
    max: 0,
    storageThreshold: Infinity,
    keepThreshold: Infinity,
    directions: [BOTTOM_RIGHT]
  },
  'W14N53': {
    body: [
      WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
      WORK, WORK, WORK, WORK, WORK,
      CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE, MOVE, MOVE, MOVE
    ],
    max: 0,
    storageThreshold: Infinity,
    keepThreshold: Infinity,
    directions: [BOTTOM_LEFT]
  }
};

const roomLogisticsOverrides = {
  'W13N54': {
    baseMinLorries: 3,
    highStorageMinLorries: 3,
    linkRelay: {
      spawnName: 'Spawn1',
      body: [CARRY],
      directions: [TOP],
      linkId: '6a2665b94350a7c7abc91fc2'
    }
  },
  'W14N53': {
    baseMinLorries: 1,
    highStorageMinLorries: 1,
    lorryEnergy: 750,
    body: [
      CARRY, CARRY, CARRY, CARRY, CARRY,
      CARRY, CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE, MOVE, MOVE, MOVE
    ]
  }
};

const bodyCounts = function (creep) {
  return _.countBy(creep.body, part => part.type);
};

const isDesiredRoomBuilder = function (creep, body) {
  const counts = bodyCounts(creep);
  const expected = _.countBy(body);
  return creep.memory.role === 'builder' &&
    counts[WORK] === expected[WORK] &&
    counts[CARRY] === expected[CARRY] &&
    counts[MOVE] === expected[MOVE];
};

const isStaticRoomBuilder = function (creep, roomName) {
  return creep.name.indexOf('StaticBuilder-' + roomName + '-') === 0;
};

const isActiveCreep = function (creep) {
  return !creep.spawning;
};

const isSpawningStaticRoomBuilder = function (spawn, roomName) {
  return spawn.spawning &&
    spawn.spawning.name &&
    spawn.spawning.name.indexOf('StaticBuilder-' + roomName + '-') === 0;
};

const isStaticRoomUpgrader = function (creep, roomName) {
  return creep.name.indexOf('StaticUpgrader-' + roomName + '-') === 0;
};

const isDesiredRoomUpgrader = function (creep, body) {
  const counts = bodyCounts(creep);
  const expected = _.countBy(body);
  return creep.memory.role === 'upgrader' &&
    counts[WORK] === expected[WORK] &&
    counts[CARRY] === expected[CARRY] &&
    counts[MOVE] === expected[MOVE];
};

const isDesiredRoomLorry = function (creep, body) {
  if (creep.memory.mineralPickup) {
    return false;
  }
  if (!body) {
    return creep.memory.role === 'lorry' && !creep.memory.linkRelay;
  }
  const counts = bodyCounts(creep);
  const expected = _.countBy(body);
  return creep.memory.role === 'lorry' &&
    !creep.memory.linkRelay &&
    counts[CARRY] === expected[CARRY] &&
    counts[MOVE] === expected[MOVE];
};

const isLinkRelayLorry = function (creep, linkRelay) {
  if (!linkRelay) {
    return false;
  }
  return creep.memory.role === 'lorry' &&
    creep.memory.linkRelay === true &&
    creep.memory.linkRelayLinkId === linkRelay.linkId;
};

const bodyEnergyCost = function (body) {
  return _.sum(body, part => BODYPART_COST[part]);
};

const extractorPickupMinAmount = 100;

const W13_UTRIUM_OPERATION = {
  roomName: 'W13N54',
  mineralId: '59f1c0d77d0b3d79de5f0dc2',
  supportSpawnPos: { x: 11, y: 17 },
  minerBody: [
    WORK, WORK, WORK, WORK, WORK,
    WORK, WORK, WORK, WORK, WORK,
    MOVE, MOVE, CARRY
  ],
  boostResource: RESOURCE_UTRIUM_OXIDE,
  builderTarget: 5
};

const getW13UtriumOperationState = function (room) {
  if (!room || room.name !== W13_UTRIUM_OPERATION.roomName) {
    return null;
  }

  const mineral = Game.getObjectById(W13_UTRIUM_OPERATION.mineralId) || room.find(FIND_MINERALS)[0];
  if (!mineral || mineral.mineralType !== RESOURCE_UTRIUM) {
    return null;
  }

  const supportSpawn = room.lookForAt(
    LOOK_STRUCTURES,
    W13_UTRIUM_OPERATION.supportSpawnPos.x,
    W13_UTRIUM_OPERATION.supportSpawnPos.y
  ).filter(s => s.structureType === STRUCTURE_SPAWN && s.my)[0];
  const supportSpawnSite = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    W13_UTRIUM_OPERATION.supportSpawnPos.x,
    W13_UTRIUM_OPERATION.supportSpawnPos.y
  ).filter(s => s.structureType === STRUCTURE_SPAWN && s.my)[0];
  const container = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => s.structureType === STRUCTURE_CONTAINER
  })[0];
  const link = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => s.structureType === STRUCTURE_LINK
  })[0];
  const boostLab = room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_LAB &&
      s.mineralType === W13_UTRIUM_OPERATION.boostResource &&
      (s.store[W13_UTRIUM_OPERATION.boostResource] || 0) >= 10 * LAB_BOOST_MINERAL &&
      (s.store[RESOURCE_ENERGY] || 0) >= 10 * LAB_BOOST_ENERGY
  })[0];

  return {
    mineral: mineral,
    supportSpawn: supportSpawn,
    supportSpawnSite: supportSpawnSite,
    container: container,
    link: link,
    boostLab: boostLab
  };
};

const isW13UtriumMinerBody = function (creep) {
  const counts = bodyCounts(creep);
  return counts[WORK] === 10 &&
    counts[MOVE] === 2 &&
    counts[CARRY] === 1;
};

const isW13UtriumMiner = function (creep) {
  return creep.memory.role === 'miner' &&
    creep.memory.sourceId === W13_UTRIUM_OPERATION.mineralId;
};

const runW13UtriumOperation = function (spawn, creepsInRoom, spawningCreepsInRoom) {
  const state = getW13UtriumOperationState(spawn.room);
  if (!state) {
    return false;
  }

  if (!Memory.rooms[spawn.room.name].w13UtriumOperation) {
    Memory.rooms[spawn.room.name].w13UtriumOperation = {};
  }
  const operationMemory = Memory.rooms[spawn.room.name].w13UtriumOperation;

  const miners = _.filter(creepsInRoom, isW13UtriumMiner);
  const activeMiners = _.filter(miners, c => c.memory.to_recycle !== 1);
  const desiredMiners = _.filter(activeMiners, c =>
    c.memory.w13UtriumBoostedMiner === true &&
    isW13UtriumMinerBody(c)
  );
  const spawningDesiredMiner = _.some(spawningCreepsInRoom, c =>
    isW13UtriumMiner(c) &&
    c.memory.w13UtriumBoostedMiner === true &&
    isW13UtriumMinerBody(c)
  );

  if (state.mineral.mineralAmount < 10) {
    operationMemory.done = true;
    _.forEach(activeMiners, c => {
      c.memory.to_recycle = 1;
    });
    return true;
  }

  if (operationMemory.done) {
    _.forEach(activeMiners, c => {
      c.memory.to_recycle = 1;
    });
    return true;
  }

  if (!state.container) {
    ensureExtractorContainerSite(spawn.room, state.mineral);
    return true;
  }

  if (!state.supportSpawn) {
    return true;
  }

  _.forEach(_.filter(activeMiners, c => !_.includes(desiredMiners, c)), c => {
    c.memory.to_recycle = 1;
    console.log('Recycling non-special W13 utrium miner [' + c.name + '] before boosted operation takeover');
  });

  if (desiredMiners.length > 1) {
    _.forEach(_.sortBy(desiredMiners, c => -(c.ticksToLive || 0)).slice(1), c => {
      c.memory.to_recycle = 1;
      console.log('Recycling duplicate boosted W13 utrium miner [' + c.name + ']');
    });
  }

  if (desiredMiners.length === 0 &&
      !spawningDesiredMiner &&
      state.supportSpawn.id === spawn.id &&
      !spawn.spawning &&
      state.boostLab &&
      spawn.room.energyAvailable >= bodyEnergyCost(W13_UTRIUM_OPERATION.minerBody)) {
    const name = 'W13BoostedUtriumMiner-' + Game.time;
    const result = spawn.spawnCreep(W13_UTRIUM_OPERATION.minerBody, name, {
      memory: {
        role: 'miner',
        sourceId: state.mineral.id,
        w13UtriumBoostedMiner: true,
        boostResource: W13_UTRIUM_OPERATION.boostResource
      },
      directions: [TOP_RIGHT, RIGHT]
    });
    if (result === OK) {
      console.log(spawn.name + ' spawning W13 boosted utrium miner: ' + name);
    } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
      console.log('Error spawning W13 boosted utrium miner in ', spawn.room, result);
    }
    return true;
  }

  return true;
};

const ensureExtractorContainerSite = function (room, mineral) {
  const existingContainer = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => s.structureType === STRUCTURE_CONTAINER
  })[0];
  if (existingContainer) {
    return false;
  }

  const existingSite = mineral.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
    filter: s => s.structureType === STRUCTURE_CONTAINER
  })[0];
  if (existingSite) {
    return false;
  }

  const terrain = room.getTerrain();
  const anchors = _.filter([room.storage].concat(room.find(FIND_MY_SPAWNS)), Boolean);
  const positions = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const x = mineral.pos.x + dx;
      const y = mineral.pos.y + dy;
      if (x <= 0 || x >= 49 || y <= 0 || y >= 49 || terrain.get(x, y) === TERRAIN_MASK_WALL) {
        continue;
      }
      const pos = new RoomPosition(x, y, room.name);
      const blockingStructure = pos.lookFor(LOOK_STRUCTURES).some(s =>
        s.structureType !== STRUCTURE_ROAD &&
        s.structureType !== STRUCTURE_RAMPART
      );
      if (blockingStructure || pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
        continue;
      }
      const anchorRange = anchors.length > 0 ? _.min(anchors, a => pos.getRangeTo(a)).pos.getRangeTo(pos) : 0;
      positions.push({ pos: pos, anchorRange: anchorRange });
    }
  }

  const ordered = _.sortBy(positions, p => p.anchorRange);
  for (let i = 0; i < ordered.length; i++) {
    const result = ordered[i].pos.createConstructionSite(STRUCTURE_CONTAINER);
    if (result === OK) {
      console.log('Created extractor container site in ', room.name, ' at ', ordered[i].pos.x, ordered[i].pos.y);
      return true;
    }
    if (result === ERR_FULL) {
      return false;
    }
  }

  console.log('Could not place extractor container site in ', room.name, ' for mineral ', mineral.id);
  return false;
};

const findExtractorStockpile = function (room) {
  const mineral = room.find(FIND_MINERALS)[0];
  if (!mineral || mineral.mineralAmount < 10) {
    return null;
  }

  const container = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => s.structureType === STRUCTURE_CONTAINER &&
      s.store &&
      s.store[mineral.mineralType] >= extractorPickupMinAmount
  })[0];
  if (!container) {
    return null;
  }

  const storeMineralInStorage = room.name === 'W14N53' &&
    mineral.mineralType === RESOURCE_OXYGEN &&
    room.storage;
  const target = storeMineralInStorage ? room.storage : (room.terminal || room.storage);
  if (!target) {
    return null;
  }

  return { mineral: mineral, container: container, target: target };
};

const hasExtractorLorryOnWay = function (room, stockpile) {
  return _.some(Game.creeps, creep => {
    if (creep.memory.role !== 'lorry' || creep.memory.linkRelay || creep.memory.to_recycle === 1) {
      return false;
    }

    const task = creep.memory._task;
    if (task &&
        task.id_from === stockpile.container.id &&
        task.mineral_type === stockpile.mineral.mineralType) {
      return true;
    }

    if ((creep.carry[stockpile.mineral.mineralType] || 0) > 0 &&
        creep.room.name === room.name) {
      return true;
    }

    return creep.room.name === room.name &&
      !creep.memory.working &&
      !task &&
      _.sum(creep.carry) < creep.carryCapacity &&
      creep.pos.getRangeTo(stockpile.container) <= 12;
  });
};

const spawnExtractorPickupLorry = function (spawn, stockpile) {
  if (spawn.spawning || spawn.room.energyAvailable < 200 || hasExtractorLorryOnWay(spawn.room, stockpile)) {
    return false;
  }

  const name = 'MineralPickup-' + spawn.room.name + '-' + Game.time;
  const result = spawn.spawnCreep([MOVE, MOVE, CARRY, CARRY], name, {
    memory: {
      role: 'lorry',
      working: false,
      maxed: false,
      mineralPickup: true,
      no_renew: true,
      _task: {
        id_from: stockpile.container.id,
        id_to: stockpile.target.id,
        mineral_type: stockpile.mineral.mineralType,
        restoreWorking: false,
        restoreMaxed: false,
        timeout: 300
      }
    }
  });

  if (result === OK) {
    console.log(spawn.name + ' spawning extractor pickup lorry for ' + spawn.room.name + ': ' + name);
    return true;
  } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
    console.log('Error spawning extractor pickup lorry in ', spawn.room, result);
  }

  return false;
};

module.exports = {
  // a function to run the logic for this role
  run: function (spawn) {
    // Ensure Memory.rooms and Memory.rooms[room.name] are initialized
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[spawn.room.name]) Memory.rooms[spawn.room.name] = {};
    if (!Memory.rooms[spawn.room.name].creep_limit) Memory.rooms[spawn.room.name].creep_limit = {};
    //spawn.createCustomCreep(energy+energy+20000, 'builderr');
    let creepsInRoom = spawn.room.find(FIND_MY_CREEPS);
    let room = spawn.room;
    const builderOverride = roomBuilderOverrides[room.name];
    const upgraderOverride = roomUpgraderOverrides[room.name];
    const logisticsOverride = roomLogisticsOverrides[room.name];
    const notUpgrading8 = roomUpgradeMode.isNotUpgrading8Room(room);
    const w13UtriumState = getW13UtriumOperationState(room);
    const w13OperationMemory = Memory.rooms[room.name].w13UtriumOperation || {};
    const w13SupportSpawnNeedsBuild = w13UtriumState &&
      w13UtriumState.supportSpawnSite &&
      !w13UtriumState.supportSpawn &&
      !w13OperationMemory.done;
    if (notUpgrading8) {
      _.forEach(_.filter(creepsInRoom, creep =>
        (isStaticRoomBuilder(creep, room.name) ||
          isStaticRoomUpgrader(creep, room.name) ||
          (creep.memory.role === 'upgrader' && !creep.memory.upgrade8Maintenance)) &&
        !creep.memory.upgrade8Maintenance &&
        creep.memory.to_recycle !== 1
      ), creep => {
        creep.memory.to_recycle = 1;
      });
    }
    if (builderOverride) {
      const storageEnergy = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0;
      const requiredUpgraders = !notUpgrading8 && upgraderOverride && storageEnergy >= (upgraderOverride.storageThreshold || 300000) ? upgraderOverride.max : 0;
      const keptUpgraders = !notUpgrading8 && upgraderOverride && storageEnergy >= (upgraderOverride.keepThreshold || 200000) ? upgraderOverride.max : requiredUpgraders;
      if (logisticsOverride) {
        const desiredLorries = storageEnergy >= 300000 ?
          logisticsOverride.highStorageMinLorries :
          logisticsOverride.baseMinLorries;
        Memory.rooms[room.name].creep_limit.minLorries = desiredLorries;
        Memory.rooms[room.name].creep_limit.maxLorries = desiredLorries;
        const desiredRoomLorries = _.sortBy(
          _.filter(creepsInRoom, creep =>
            isDesiredRoomLorry(creep, logisticsOverride.body) &&
            creep.memory.to_recycle !== 1
          ),
          creep => -(creep.ticksToLive || 0)
        );
        const keptLorryNames = _.map(desiredRoomLorries.slice(0, desiredLorries), creep => creep.name);
        _.forEach(_.filter(creepsInRoom, creep =>
          creep.memory.role === 'lorry' &&
          !creep.memory.linkRelay &&
          !(creep.memory.mineralPickup && creep.memory._task) &&
          creep.memory.to_recycle !== 1 &&
          !_.includes(keptLorryNames, creep.name)
        ), creep => {
          creep.memory.to_recycle = 1;
        });

        const linkRelayExists = logisticsOverride.linkRelay && _.some(Game.creeps, creep =>
          isLinkRelayLorry(creep, logisticsOverride.linkRelay) &&
          creep.room.name === room.name &&
          creep.memory.to_recycle !== 1
        );
        if (logisticsOverride.linkRelay &&
            !linkRelayExists &&
            spawn.name === logisticsOverride.linkRelay.spawnName &&
            !spawn.spawning &&
            spawn.room.energyAvailable >= bodyEnergyCost(logisticsOverride.linkRelay.body)) {
          const relayName = 'LinkRelay-' + room.name + '-' + Game.time;
          const relayResult = spawn.spawnCreep(logisticsOverride.linkRelay.body, relayName, {
            memory: {
              role: 'lorry',
              working: false,
              linkRelay: true,
              linkRelayLinkId: logisticsOverride.linkRelay.linkId
            },
            directions: logisticsOverride.linkRelay.directions
          });
          if (relayResult === OK) {
            console.log(spawn.name + ' spawning link relay lorry for ' + room.name + ': ' + relayName);
            return;
          } else if (relayResult !== ERR_BUSY && relayResult !== ERR_NOT_ENOUGH_ENERGY) {
            console.log('Error spawning link relay lorry in ', room, relayResult);
          }
        }

        const extractorStockpile = w13SupportSpawnNeedsBuild ? null : findExtractorStockpile(room);
        if (extractorStockpile && spawnExtractorPickupLorry(spawn, extractorStockpile)) {
          return;
        }
      }
      spawn.memory.minBuilders = 0;
      spawn.memory.minUpgraders = requiredUpgraders;
      spawn.memory.maxBuilders = 1;
      spawn.memory.maxUpgraders = keptUpgraders;
      Memory.rooms[room.name].creep_limit.minBuilders = 0;
      Memory.rooms[room.name].creep_limit.minUpgraders = requiredUpgraders;
      Memory.rooms[room.name].creep_limit.maxBuilders = 1;
      Memory.rooms[room.name].creep_limit.maxUpgraders = keptUpgraders;
      if (notUpgrading8 && room.find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
        const targetBuilders = w13SupportSpawnNeedsBuild ? W13_UTRIUM_OPERATION.builderTarget : 1;
        spawn.memory.minBuilders = targetBuilders;
        Memory.rooms[room.name].creep_limit.minBuilders = targetBuilders;
      }

      if (notUpgrading8 &&
          room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 &&
          spawn.name === builderOverride.spawnName &&
          !spawn.spawning) {
        const builders = _.filter(creepsInRoom, creep =>
          creep.memory.role === 'builder' &&
          creep.memory.to_recycle !== 1
        );
        const targetBuilders = w13SupportSpawnNeedsBuild ? W13_UTRIUM_OPERATION.builderTarget : 1;
        if (builders.length < targetBuilders) {
          const builderEnergy = Math.min(spawn.room.energyAvailable, 3200);
          if (builderEnergy >= 500) {
            const result = spawn.createCustomCreep(builderEnergy, 'builder', {
              role: 'builder',
              working: false,
              maxed: false,
              no_renew: true,
              infrastructure: true
            });
            if (_.isString(result)) {
              console.log(spawn.name + ' spawning not-upgrading infrastructure builder for ' + room.name + ': ' + result);
              return;
            } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
              console.log('Error spawning not-upgrading infrastructure builder in ', room, result);
            }
          }
        }
      }

      if (!notUpgrading8) {
      const desiredBuilders = _.sortBy(
        _.filter(creepsInRoom, creep =>
          isStaticRoomBuilder(creep, room.name) &&
          isDesiredRoomBuilder(creep, builderOverride.body)
        ),
        creep => -(creep.ticksToLive || 0)
      );
      const activeDesiredBuilders = _.filter(desiredBuilders, isActiveCreep);
      const keptBuilder = activeDesiredBuilders[0] || desiredBuilders[0];
      const keptBuilderName = keptBuilder && keptBuilder.name;
      const hasActiveKeptBuilder = keptBuilder && isActiveCreep(keptBuilder);
      if (keptBuilder && keptBuilder.memory.to_recycle === 1) {
        delete keptBuilder.memory.to_recycle;
      }
      const staticBuilderSpawning = _.some(Game.spawns, spawn => isSpawningStaticRoomBuilder(spawn, room.name));
      if (staticBuilderSpawning) {
        Memory.rooms[room.name].lastStaticBuilderSpawnTick = Game.time;
      }
      const staticBuilderSpawnWindow = bodyEnergyCost(builderOverride.body) > 0 ? builderOverride.body.length * 3 + 25 : 100;
      const recentStaticBuilderSpawn = Memory.rooms[room.name].lastStaticBuilderSpawnTick &&
        Game.time - Memory.rooms[room.name].lastStaticBuilderSpawnTick < staticBuilderSpawnWindow;
      const staticBuilderSpawn = Game.spawns[builderOverride.spawnName];
      const remoteConstructionSites = staticBuilderSpawn ? room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: site => site.pos.getRangeTo(staticBuilderSpawn) > 3
      }) : [];
      const infrastructureBuilders = _.sortBy(
        _.filter(creepsInRoom, creep =>
          creep.memory.role === 'builder' &&
          !isStaticRoomBuilder(creep, room.name) &&
          creep.memory.to_recycle !== 1
        ),
        creep => -(creep.ticksToLive || 0)
      );
      const maxInfrastructureBuilders = w13SupportSpawnNeedsBuild ?
        W13_UTRIUM_OPERATION.builderTarget :
        (remoteConstructionSites.length > 0 ? 2 : 0);
      const keptInfrastructureBuilderNames = _.map(
        infrastructureBuilders.slice(0, maxInfrastructureBuilders),
        creep => creep.name
      );
      const desiredUpgraders = upgraderOverride ? _.sortBy(
        _.filter(creepsInRoom, creep => isDesiredRoomUpgrader(creep, upgraderOverride.body) && creep.memory.to_recycle !== 1),
        creep => -(creep.ticksToLive || 0)
      ) : [];
      const keptUpgraderNames = _.map(desiredUpgraders.slice(0, keptUpgraders), creep => creep.name);
      if (hasActiveKeptBuilder && !staticBuilderSpawning) {
        _.forEach(_.filter(creepsInRoom, creep =>
          (isStaticRoomBuilder(creep, room.name) || isStaticRoomUpgrader(creep, room.name)) &&
          creep.name !== keptBuilderName
        ), creep => {
          creep.memory.to_recycle = 1;
        });
      }

      if (keptBuilderName) {
        const extraWorkers = _.filter(creepsInRoom, creep =>
          (creep.memory.role === 'upgrader' || creep.memory.role === 'builder') &&
          creep.name !== keptBuilderName &&
          !isStaticRoomBuilder(creep, room.name) &&
          !isStaticRoomUpgrader(creep, room.name) &&
          !_.includes(keptInfrastructureBuilderNames, creep.name) &&
          !_.includes(keptUpgraderNames, creep.name)
        );
        _.forEach(extraWorkers, creep => {
          creep.memory.to_recycle = 1;
        });
      }

      if (!keptBuilderName &&
          !staticBuilderSpawning &&
          !recentStaticBuilderSpawn &&
          spawn.name === builderOverride.spawnName &&
          !spawn.spawning) {
        if (spawn.room.energyAvailable >= bodyEnergyCost(builderOverride.body)) {
          const name = 'StaticBuilder-' + room.name + '-' + Game.time;
          const result = spawn.spawnCreep(builderOverride.body, name, {
            memory: { role: 'builder', working: false, maxed: false },
            directions: builderOverride.directions
          });
          if (result === OK) {
            Memory.rooms[room.name].lastStaticBuilderSpawnTick = Game.time;
            console.log(spawn.name + ' spawning room-specific builder for ' + room.name + ': ' + name);
          } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
            console.log('Error spawning room-specific builder in ', room, result);
          }
        }
        return;
      }

      if (remoteConstructionSites.length > 0 &&
          infrastructureBuilders.length < maxInfrastructureBuilders &&
          spawn.name === builderOverride.spawnName &&
          !spawn.spawning) {
        const builderEnergy = Math.min(spawn.room.energyAvailable, 3200);
        if (builderEnergy >= 500) {
          const result = spawn.createCustomCreep(builderEnergy, 'builder', {
            role: 'builder',
            working: false,
            maxed: false,
            no_renew: true,
            infrastructure: true
          });
          if (_.isString(result)) {
            console.log(spawn.name + ' spawning infrastructure builder for ' + room.name + ': ' + result);
          } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
            console.log('Error spawning infrastructure builder in ', room, result);
          }
        }
        return;
      }

      if (upgraderOverride &&
          requiredUpgraders > desiredUpgraders.length &&
          spawn.name === builderOverride.spawnName &&
          !spawn.spawning) {
        if (spawn.room.energyAvailable >= bodyEnergyCost(upgraderOverride.body)) {
          const upgraderName = 'StaticUpgrader-' + room.name + '-' + Game.time;
          const upgraderResult = spawn.spawnCreep(upgraderOverride.body, upgraderName, {
            memory: { role: 'upgrader', working: false, maxed: false },
            directions: upgraderOverride.directions || builderOverride.directions
          });
          if (upgraderResult === OK) {
            console.log(spawn.name + ' spawning room-specific upgrader for ' + room.name + ': ' + upgraderName);
          } else if (upgraderResult !== ERR_BUSY && upgraderResult !== ERR_NOT_ENOUGH_ENERGY) {
            console.log('Error spawning room-specific upgrader in ', room, upgraderResult);
          }
        }
        return;
      }
      }
    }

    if (roomUpgradeMode.shouldSpawnMaintenanceUpgrader(room) && !spawn.spawning) {
      const maintenanceBody = roomUpgradeMode.maintenanceUpgraderBody;
      if (spawn.room.energyAvailable >= bodyEnergyCost(maintenanceBody)) {
        const maintenanceName = 'MaintenanceUpgrader-' + room.name + '-' + Game.time;
        const maintenanceResult = spawn.spawnCreep(maintenanceBody, maintenanceName, {
          memory: {
            role: 'upgrader',
            working: false,
            maxed: false,
            no_renew: true,
            home: room.name,
            upgrade8Maintenance: true
          }
        });
        if (maintenanceResult === OK) {
          roomUpgradeMode.recordMaintenanceUpgraderSpawn(room);
          console.log(spawn.name + ' spawning not-upgrading-8 maintenance upgrader for ' + room.name + ': ' + maintenanceName);
          return;
        } else if (maintenanceResult !== ERR_BUSY && maintenanceResult !== ERR_NOT_ENOUGH_ENERGY) {
          console.log('Error spawning not-upgrading-8 maintenance upgrader in ', room, maintenanceResult);
        }
      }
    }

    /* LDH. Data from Memory.rooms.ROOM.ldh */
    if (Memory && Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].ldh) {
      _.forEach(Memory.rooms[room.name].ldh, (v, k) => {
        //console.log('/////',room.name,  k);
        let l_room = k;
        let l_ldh = Memory.rooms[spawn.room.name].ldh[l_room];
        if (!l_ldh) {
          l_ldh = { spawning: 0, n: 0, max: 0, work_parts: 10 };
        }
        //console.log('-----', spawn.name, 'spawning: ', l_ldh.spawning, 'n: ', l_ldh.n, 'max:', l_ldh.max);
        if (l_ldh.max > (l_ldh.spawning + l_ldh.n)) {
          // want to create harvester
          //console.log(' ++++ need ', l_ldh.max - (l_ldh.spawning+l_ldh.n), ' harvesters');
          name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable - 200, l_ldh.work_parts || 10, l_ldh.home || spawn.room.name, l_room, 0);
          // raise the counter of spawning creeps if creeps is started
          // it is set properly later in room.planner.ldh.set_ldhs
          if (_.isString(name)) { // only if it spawned
            Memory.rooms[spawn.room.name].ldh[l_room].spawning++;
            return;
          }
        }
      });
    }

    if (room.energyAvailable === room.energyCapacityAvailable) {
      spawn.memory.maxedEnergy++;
    }

    /* Things to do every 20 ticks
       - search for old roads. If enough, make a repairer (switch upgrader or create new one)
    */
    if (Game.time % 20 === 0) {
      /* find structures having ie below 50% of life */
      let l_structures_needing_repair = _.size(room.find(FIND_STRUCTURES, { filter: (s) => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL && s.hits < (s.hitsMax * (spawn.memory._rep_treshold_min || 0.5)) }));
      if (l_structures_needing_repair > 0) {
        console.log('Structures ', room, ' below ', (spawn.memory._rep_treshold_min || 0.5) * 100, '%: ', l_structures_needing_repair);
        // get a repairer if there is none
        // TODO: Creep must by in the spawn room OMG
        let l_repairer_in_room = _.size(room.find(FIND_MY_CREEPS, { filter: (s) => s.memory.role === 'repairer' }));
        console.log('Repairer count: ', l_repairer_in_room);
        if (l_repairer_in_room === 0) {
          // no repairer in the room. try 1) change builder/upgrader, 2) spawn one
          let l_preserve_builders = _.size(room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (s) => s.structureType !== STRUCTURE_ROAD
          })) > 0;
          let l_repairer_candidates = room.find(FIND_MY_CREEPS, {
            filter: (s) => s.memory.role === 'builder' && !isStaticRoomBuilder(s, room.name)
          });
          if (l_repairer_candidates.length > 0 && !l_preserve_builders) {
            // 1)
            let l_repairer = l_repairer_candidates[0];
            l_repairer.memory.role = 'repairer';
            l_repairer.memory._rep_treshold_max = spawn.memory._rep_treshold_min + 0.1; // repair a bit more then spawn treshold
            console.log('Changed an upgrader to repairer. Set _rep_treshold_max: ', l_repairer.memory._rep_treshold_max);
          } else {
            // 2)
            if (spawn.memory.minRepairers === 0) {
              spawn.memory.minRepairers = 1;
              if (spawn.memory.minUpgraders > 0) {
                spawn.memory.minUpgraders -= 1;
              }
            } else {
              console.log('Repairer min count set to: ', spawn.memory.minRepairers);
              if (spawn.spawning && Game.creeps[spawn.spawning.name].memory.role === 'repairer') {
                console.log('OK, already spawning repairer');
              } else {
                console.log('Should be spawning repairer in few ticks');
              }
            }
          }
        }
      } else {
        if (spawn.memory.minRepairers === 1 && spawn.memory.minBuilders < 8) {
          const repairer = room.find(FIND_MY_CREEPS, { filter: (s) => s.memory.role === 'repairer' })[0];
          if (repairer) {
            // the tick when the buildings are OK
            spawn.memory.minBuilders++; // we change back the minUpgraders (builder behaves as upgrader when there are no buildings)
            // change role of the repairer to builder
            repairer.memory.role = 'builder';
            console.log('changing repairer back to builder');
          } else {
            console.log('No repairer found in ', room, ' while clearing repairer request');
          }
        }
        spawn.memory.minRepairers = 0; // we dont need repairers
      }
    }

    /* Renew or Recycle */
    // initialize memory for spawn stats
    if (!Memory.spawns) Memory.spawns = {};
    if (!Memory.spawns[spawn.id]) Memory.spawns[spawn.id] = { renew_count: 0, events_history: {} };

    const recordSpawnEvent = function (sid, type) {
      const bucket = Math.floor(Game.time / 60);
      if (!Memory.spawns[sid].events_history) Memory.spawns[sid].events_history = {};
      const key = bucket.toString();
      if (!Memory.spawns[sid].events_history[key]) Memory.spawns[sid].events_history[key] = { renew: 0 };
      Memory.spawns[sid].events_history[key][type] += 1;
      // prune older buckets beyond 24h
      const minKey = (bucket - 1440).toString();
      for (const k in Memory.spawns[sid].events_history) {
        if (k < minKey) delete Memory.spawns[sid].events_history[k];
      }
    };

    const aggregateSpawnEvents = function (sid, minutes) {
      const currentBucket = Math.floor(Game.time / 60);
      const minBucket = currentBucket - minutes + 1;
      const out = { renew: 0 };
      if (!Memory.spawns[sid].events_history) return out;
      for (const k in Memory.spawns[sid].events_history) {
        const kb = parseInt(k);
        if (kb >= minBucket && kb <= currentBucket) {
          const v = Memory.spawns[sid].events_history[k];
          out.renew += v.renew || 0;
        }
      }
      return out;
    };

    const rolesToRenew = ['longDistanceHarvester', 'longDistanceWorker', 'builder', 'miner', 'harvester', 'upgrader', 'lorry', 'attacker'];
    let _renewTarget = spawn.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: s => s.memory &&
        rolesToRenew.includes(s.memory.role) &&
        !(notUpgrading8 && s.memory.role === 'upgrader' && !s.memory.upgrade8Maintenance) &&
        s.ticksToLive > 100 &&
        s.ticksToLive < 1400 &&
        !s.memory.no_renew &&
        s.pos.isNearTo(spawn.pos)
    });
    if (_renewTarget) {
      let _r = spawn.renewCreep(_renewTarget);
      if (_r === 0) {
        Memory.spawns[spawn.id].renew_count += 1;
        recordSpawnEvent(spawn.id, 'renew');
      }
    }
    // compute aggregates every 20 ticks
    if (Game.time % 20 === 0) {
      Memory.spawns[spawn.id].events_summary = {
        lastHour: aggregateSpawnEvents(spawn.id, 60),
        lastDay: aggregateSpawnEvents(spawn.id, 60 * 24)
      };
    }

    const l_adjecent_creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
    if (l_adjecent_creeps.length > 0) {
      l_adjecent_creeps.forEach(function (c) {
        if (c.memory.to_recycle === 1) {
          spawn.recycleCreep(c);
          console.log('Recycling creep: ' + c);
        }
      });
    }

    if (spawn.name === 'Spawn222') {
      if (Game.time % 1500 >= 0 && Game.time % 1500 <= 50) {
        ////spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
        //spawn.createCreep([ATTACK,ATTACK,TOUGH,ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E6N37'});
      }
      return;
    }
    if (spawn.name === 'Spawn444') {
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50) {
        //Game.spawns.Spawn444.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
        ////Game.spawns.Spawn444.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      return;
    }
    if (spawn.name === 'Spawn666') {
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50) {
        //Game.spawns.Spawn666.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
        ////Game.spawns.Spawn666.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      return;
    }
    if (spawn.name === 'Spawn999') {
      if (Game.time % 2600 >= 0 && Game.time % 2600 <= 50) {
        //spawn.createLongDistanceHarvester(5000, 10, 'E2N29', 'E2N29', 0);
        //spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK],null,{role: 'attacker', target: 'E2N29', b: false});
      }
      return;
    }

    // count the number of creeps alive for each role in this room
    // _.sum will count the number of properties in Game.creeps filtered by the
    //  arrow function, which checks for the creep being a specific role
    var numberOfHarvesters = _.sum(creepsInRoom, (c) => c.memory.role === 'harvester');
    var numberOfUpgraders = _.sum(creepsInRoom, (c) => c.memory.role === 'upgrader');
    var numberOfBuilders = _.sum(creepsInRoom, (c) => c.memory.role === 'builder');
    var numberOfRepairers = _.sum(creepsInRoom, (c) => c.memory.role === 'repairer');
    var numberOfWallRepairers = _.sum(creepsInRoom, (c) => c.memory.role === 'wallRepairer');
    var numberOfMiners = 1;//_.sum(creepsInRoom, (c) => c.memory.role === 'miner' && !Game.getObjectById(c.memory.sourceId).mineralType);
    const spawningCreepsInRoom = _.map(
      _.filter(room.find(FIND_MY_SPAWNS), s => s.spawning && Game.creeps[s.spawning.name]),
      s => Game.creeps[s.spawning.name]
    );
    if (!Memory.rooms[room.name].miner_spawn_reservations) {
      Memory.rooms[room.name].miner_spawn_reservations = {};
    }
    const minerSpawnReservations = Memory.rooms[room.name].miner_spawn_reservations;
    _.forEach(minerSpawnReservations, (tick, sourceId) => {
      if (Game.time - tick > 200 ||
          _.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === sourceId && c.memory.to_recycle !== 1) ||
          _.some(spawningCreepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === sourceId && c.memory.to_recycle !== 1)) {
        delete minerSpawnReservations[sourceId];
      }
    });
    const isMinerSpawnReserved = function (sourceId) {
      return minerSpawnReservations[sourceId] && Game.time - minerSpawnReservations[sourceId] <= 200;
    };
    const reserveMinerSpawn = function (sourceId, result) {
      if (_.isString(result)) {
        minerSpawnReservations[sourceId] = Game.time;
      }
    };
    var numberOfLorries = _.sum(creepsInRoom, (c) =>
      c.memory.role === 'lorry' &&
      (!logisticsOverride || isDesiredRoomLorry(c, logisticsOverride.body))
    ) + _.sum(spawningCreepsInRoom, (c) =>
      c.memory.role === 'lorry' &&
      (!logisticsOverride || isDesiredRoomLorry(c, logisticsOverride.body))
    );

    var energy = spawn.room.energyCapacityAvailable - (spawn.memory.energy_deflator || 0);
    var name = '';

    // if no harvesters are left AND either no miners or no lorries are left
    //  create a backup creep
    if (numberOfHarvesters === 0 && numberOfLorries === 0) {
      // if there are still miners left
      if (numberOfMiners > 0 ||
        (spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
        // create a lorry
        console.log('Creating small lorry. Number of miner:', numberOfMiners, ' in room ', spawn.room);
        name = spawn.createLorry(150);
      }
      // if there is no miner left
      else {
        // create a harvester because it can work on its own
        name = spawn.createCustomCreep(spawn.room.energyAvailable, 'harvester');
      }
    }
    // if no backup creep is required
    else {
      // check if all sources have miners
      let sources = spawn.room.find(FIND_SOURCES);
      // iterate over all sources
      for (let source of sources) {
        // if the source has no miner
        if (!_.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === source.id)) {
          // check whether or not the source has a container
          let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
          });
          // if there is a container next to the source
          if (containers.length > 0) {
            // spawn a miner
            // TODO: revisit. Causes problems in W13N45 - builds miner even though there is a harvester there
            // name = spawn.createMiner(source.id);
            console.log('NOT Creating miner the OLD way');
            break;
            if (name === -6) {
              name = null; // nejsou mineraly na minera, udelame harvestera
            } else {
              break;
            }
          }
        } else {
          // if the source has aging moner
          // get the travel distance from miner's position to spawn
          let l_miner = source.pos.findInRange(FIND_MY_CREEPS, 1, { filter: s => s.memory.role === 'miner' })[0];
          let l_distance = [];
          if (l_miner) {
            l_distance = spawn.pos.findPathTo(l_miner.pos.x, l_miner.pos.y);
          }
          // time needed to get miner there (BODY_PARTS*3) + (TILES*2) + reserve
          let l_time_needed = (7 * 3) + (l_distance.length * 2) + 3; // 3 slight reserve
          // The total spawn time of a creep is the number of body part * 3 ticks
          if (l_miner && l_time_needed >= l_miner.ticksToLive) {
            let l_source_needs_miner = !_.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === source.id && c.ticksToLive > l_time_needed);
            // miners for the source with acceptable age (ie. the newly created one)
            if (l_source_needs_miner) {
              // or the spawning one
              l_source_needs_miner = !(spawn.spawning && Game.creeps[spawn.spawning.name].memory.sourceId === source.id && Game.creeps[spawn.spawning.name].memory.role === 'miner') &&
                !isMinerSpawnReserved(source.id);
            }

            if (l_source_needs_miner) {
              name = spawn.createMiner(source.id);
              reserveMinerSpawn(source.id, name);
              console.log('Need [' + spawn.name + '] to replace ' + l_miner + ' dying miner [' + l_miner.pos.x + ',' + l_miner.pos.y + ']. New miner\'s name is ' + name);
            }
          }
        }
      } // end loop sources

      /* LOOP MIONERAL MINERS */
      // check if all sources have miners
      const handledW13UtriumOperation = runW13UtriumOperation(spawn, creepsInRoom, spawningCreepsInRoom);

      let minerals = spawn.room.find(FIND_MINERALS);
      // iterate over all sources
      for (let source of minerals) {
        if (handledW13UtriumOperation && source.id === W13_UTRIUM_OPERATION.mineralId) {
          continue;
        }
        if (source.mineralAmount < 10) {
          break; // donw want to build miners where there are almost no minerals
        }
        // check whether or not the source has a container
        let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        if (containers.length === 0) {
          ensureExtractorContainerSite(spawn.room, source);
          continue;
        }

        const mineralMiners = _.sortBy(
          _.filter(creepsInRoom, c =>
            c.memory.role === 'miner' &&
            c.memory.sourceId === source.id &&
            c.memory.to_recycle !== 1
          ),
          c => (c.pos.isEqualTo(containers[0].pos) ? 0 : 10000) - (c.ticksToLive || 0)
        );
        const spawningMineralMiner = _.some(spawningCreepsInRoom, c =>
          c.memory.role === 'miner' &&
          c.memory.sourceId === source.id &&
          c.memory.to_recycle !== 1
        );

        _.forEach(mineralMiners.slice(1), c => {
          c.memory.to_recycle = 1;
          console.log('Recycling duplicate mineral miner [' + c.name + '] for source [' + source.id + ']');
        });

        // Mineral extractors are cooldown-bound and have one useful container spot.
        // Do not pre-spawn a replacement while a mineral miner still exists.
        if (mineralMiners.length === 0 && !spawningMineralMiner && !isMinerSpawnReserved(source.id)) {
          name = spawn.createMiner(source.id);
          reserveMinerSpawn(source.id, name);
          console.log('Creating mineral miner the OLD way');
          if (name === -6) {
            name = null; // nejsou mineraly na minera, udelame harvestera
          } else {
            break;
          }
        }
      } // end loop mineral sources

    }
    // if none of the above caused a spawn command check for other roles
    if (!name) {
      // if not enough harvesters
      if (numberOfHarvesters < spawn.memory.minHarvesters) {
        name = spawn.createCustomCreep(energy, 'harvester');
      }

      // if not enough lorries
      else if (numberOfLorries < (Memory.rooms[spawn.room.name].creep_limit.minLorries || 0)) {
        if (logisticsOverride && logisticsOverride.lorryEnergy) {
          energy = logisticsOverride.lorryEnergy;
        } else if (energy > 899) {
          energy = 900;
          if (spawn.room.controller.level > 5) {
            energy = 1300;
          }
          if (spawn.room.controller.level === 8) {
            energy = 1600; //floor 1600/150=10
          }
        }
        name = spawn.createLorry(energy);
        // if not enough energy to create lorry
        if (name === -6) {
          // create harvester instead
          name = spawn.createLorry(150);
        }
      }
      // if there is a claim order defined
      else if (spawn.memory.claimRoom) {
        // try to spawn a claimer
        name = spawn.createClaimer(spawn.memory.claimRoom);
        // if that worked
        if (!(name < 0)) {
          // delete the claim order
          delete spawn.memory.claimRoom;
        }
      }
      // if there are claim flags and no claimer for them
      else if (Memory.claimFlags) {
        // Check if there are any flags to process
        let hasFlags = false;
        for (let flagName in Memory.claimFlags) {
          if (Game.flags[flagName]) {
            hasFlags = true;
            break;
          }
        }
        
        if (hasFlags) {
          // check if we already have a claimer with role 'claimer' that's handling flags
          let existingClaimers = _.filter(Game.creeps, c => 
            c.memory.role === 'claimer' && c.memory.claimFlagMode === true
          );
          
          // Only spawn a new claimer if we don't have one already
          if (existingClaimers.length === 0) {
            // Find the nearest claim flag to this spawn
            let nearestFlag = null;
            let nearestDistance = Infinity;
            
            for (let flagName in Memory.claimFlags) {
              let flag = Game.flags[flagName];
              if (flag) {
                let distance = Game.map.getRoomLinearDistance(spawn.room.name, flag.pos.roomName);
                if (distance < nearestDistance) {
                  nearestDistance = distance;
                  nearestFlag = flag;
                }
              }
            }
            
            if (nearestFlag) {
              // Create a claimer with [MOVE, CLAIM] body
              name = spawn.createCreep([MOVE, CLAIM], null, { 
                role: 'claimer', 
                target: nearestFlag.pos.roomName,
                claimFlagMode: true
              });
            }
          }
        }
      }
      // if not enough upgraders
      else if (!notUpgrading8 && !upgraderOverride && Memory.rooms[spawn.room.name] && Memory.rooms[spawn.room.name].creep_limit && Memory.rooms[spawn.room.name].creep_limit.minUpgraders && numberOfUpgraders < Memory.rooms[spawn.room.name].creep_limit.minUpgraders) {
        name = spawn.createCustomCreep(energy, 'upgrader');
      }
      // if not enough repairers
      else if (numberOfRepairers < spawn.memory.minRepairers) {
        if (energy > 899) { energy = 900; } // we dont need huge repairers
        name = spawn.createCustomCreep(energy, 'repairer');
        if (_.isString(name)) { // only if it spawned
          Game.creeps[name].memory._rep_treshold_max = 0.8;
        }
      }
      // if not enough builders
      else if (numberOfBuilders < spawn.memory.minBuilders || (Memory.rooms[spawn.room.name] && Memory.rooms[spawn.room.name].creep_limit && Memory.rooms[spawn.room.name].creep_limit.minBuilders && numberOfBuilders < Memory.rooms[spawn.room.name].creep_limit.minBuilders)) {
        name = spawn.createCustomCreep(energy, 'builder');
        console.log('Builder spawning: ', name, spawn.room);
      }
      // if not enough wallRepairers
      else if (numberOfWallRepairers < spawn.memory.minWallRepairers) {
        name = spawn.createCustomCreep(energy, 'wallRepairer');
      }
      else {
        name = -1;
      }
    }

    // print name to console if spawning was a success
    // name > 0 would not work since string > 0 returns false
    if (!(name < 0)) {
      const spawnedCreep = typeof name === 'string' ? Game.creeps[name] : null;
      if (spawnedCreep && spawnedCreep.memory && spawnedCreep.memory.role) {
        console.log(spawn.name + ' spawned new creep in ', spawn.room, ': ' + name + ' (' + spawnedCreep.memory.role + ')');
        if (!spawn.memory._spawned) {
          spawn.memory._spawned = {};
        }
        if (spawn.memory._spawned[spawnedCreep.memory.role]) {
          spawn.memory._spawned[spawnedCreep.memory.role]++;
        } else {
          spawn.memory._spawned[spawnedCreep.memory.role] = 1;
        }
        if (spawnedCreep.memory.target) {
          console.log(' -- target: ', spawnedCreep.memory.target);
        }
      } else {
        console.log(spawn.name + ' spawning attempt in ' + spawn.room + ': ' + name);
      }
      console.log('Harvesters    : ' + numberOfHarvesters);
      console.log('Upgraders     : ' + numberOfUpgraders);
      console.log('Builders      : ' + numberOfBuilders);
      console.log('Repairers     : ' + numberOfRepairers);
      console.log('WallRepairers : ' + numberOfWallRepairers);
      console.log('Miners        : ' + numberOfMiners);
      console.log('Lorries (450) : ' + numberOfLorries);
    } else if (name !== ERR_BUSY && name !== ERR_NOT_ENOUGH_ENERGY && name !== ERR_NOT_OWNER) {
      console.log('Error spawning creep in ', spawn, name);
    }

    /* Set default number of roles for the spawn depending on controller level */
    if (spawn.room.controller.level === 1 && !spawn.memory._pt_lvl) {
      console.log('Default number of creeps set for room to:', spawn.room);
      spawn.memory.minHarvesters = spawn.memory.minHarvesters || 1;
      Memory.rooms[spawn.room.name].creep_limit.minLorries = Memory.rooms[spawn.room.name].creep_limit.minLorries || 0;
      if (spawn.memory.minBuilders == null) {
        spawn.memory.minBuilders = 1;
      }
      if (spawn.memory.minUpgraders == null) {
        spawn.memory.minUpgraders = 1;
      }
    } else if (spawn.room.controller.level === 2 && spawn.memory._pt_lvl !== 2) {
      // upgraded form 1 to 2
      console.log('Room upgraded to lvl 2 ', spawn.room);
      spawn.memory.minBuilders = 3; // 3 builders, 1 harvester, 1 upgrader
    } else if (spawn.room.controller.level === 7 && spawn.memory._pt_lvl !== 7) {
      // reduce the number of builders. Thez get much much bigger
      spawn.memory.minBuilders = 1;
    } else if (spawn.room.controller.level === 8 && spawn.memory._pt_lvl === 7) {
      if (Memory.rooms[spawn.room.name].creep_limit.minBuilders == null) {
        Memory.rooms[spawn.room.name].creep_limit.minBuilders = 0;
      }
      if (Memory.rooms[spawn.room.name].creep_limit.minUpgraders == null) {
        Memory.rooms[spawn.room.name].creep_limit.minUpgraders = 1;
      }
    } else if (spawn.room.controller.level !== spawn.memory._pt_lvl) {
      console.log('upgraded from ', spawn.memory._pt_lvl, ' to ', spawn.room.controller.level);
    }
    //console.log(spawn.room.controller.level);
    spawn.memory._pt_lvl = spawn.room.controller.level; // lvl previous tick
  },

  is_reserver_needed: (spawn, target) => {
    console.log('is_reserver_needed start for: ', target);
    let l_needed = false;

    return l_needed;
  }
};
