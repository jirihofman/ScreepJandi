const TARGET_ROOMS = ['W13N54', 'W14N53'];

const bodyCost = function (body) {
  return _.sum(body, part => BODYPART_COST[part.type || part]);
};

const activeParts = function (creep, partType) {
  return creep.getActiveBodyparts(partType);
};

const add = function (key, amount) {
  const experiment = Memory.logisticsExperiment;
  if (!experiment || !experiment.enabled || !amount || amount < 0) {
    return;
  }
  experiment.counters[key] = (experiment.counters[key] || 0) + amount;
};

const addMineral = function (resourceType, amount) {
  const experiment = Memory.logisticsExperiment;
  if (!experiment || !experiment.enabled || !amount || amount < 0) {
    return;
  }
  experiment.counters.harvestedMinerals[resourceType] =
    (experiment.counters.harvestedMinerals[resourceType] || 0) + amount;
};

const wrap = function (prototype, method, handler) {
  const original = prototype && prototype[method];
  if (!original || original.__logisticsExperimentWrapped) {
    return;
  }
  const wrapped = function () {
    const args = Array.prototype.slice.call(arguments);
    const result = original.apply(this, args);
    if (result === OK && Memory.logisticsExperiment && Memory.logisticsExperiment.enabled) {
      handler.apply(this, args);
    }
    return result;
  };
  wrapped.__logisticsExperimentWrapped = true;
  prototype[method] = wrapped;
};

const installHooks = function () {
  wrap(Creep.prototype, 'harvest', function (target) {
    const work = activeParts(this, WORK);
    if (target.mineralType) {
      addMineral(target.mineralType, Math.min(target.mineralAmount, work * HARVEST_MINERAL_POWER));
    } else {
      add('harvestedEnergy', Math.min(target.energy, work * HARVEST_POWER));
    }
  });
  wrap(Creep.prototype, 'repair', function (target) {
    const missing = Math.max(0, target.hitsMax - target.hits);
    add('repairEnergy', Math.min(activeParts(this, WORK), Math.ceil(missing / REPAIR_POWER)));
  });
  wrap(Creep.prototype, 'build', function (target) {
    const remaining = Math.max(0, target.progressTotal - target.progress);
    add('buildEnergy', Math.min(activeParts(this, WORK), Math.ceil(remaining / BUILD_POWER)));
  });
  wrap(Creep.prototype, 'upgradeController', function () {
    add('upgradeEnergy', activeParts(this, WORK) * UPGRADE_CONTROLLER_POWER);
  });
  wrap(Creep.prototype, 'transfer', function (target, resourceType, amount) {
    if (this.memory.role !== 'lorry') return;
    const available = this.store[resourceType] || 0;
    const free = target.store && target.store.getFreeCapacity ? target.store.getFreeCapacity(resourceType) : available;
    const moved = Math.min(amount == null ? available : amount, available, free == null ? available : free);
    if (resourceType === RESOURCE_ENERGY) add('lorryEnergyDelivered', moved);
    else add('lorryMineralsDelivered', moved);
  });
  wrap(StructureTower.prototype, 'repair', function () {
    add('towerEnergy', TOWER_ENERGY_COST);
  });
  wrap(StructureTower.prototype, 'attack', function () {
    add('towerEnergy', TOWER_ENERGY_COST);
  });
  wrap(StructureTower.prototype, 'heal', function () {
    add('towerEnergy', TOWER_ENERGY_COST);
  });
  wrap(StructureSpawn.prototype, 'renewCreep', function (creep) {
    const cost = Math.ceil(SPAWN_RENEW_RATIO * bodyCost(creep.body) /
      CREEP_SPAWN_TIME / creep.body.length);
    add('renewEnergy', cost);
  });
  wrap(StructureTerminal.prototype, 'send', function (resourceType, amount, destination) {
    add('terminalEnergy', Game.market.calcTransactionCost(amount, this.room.name, destination));
  });
};

const collectInventory = function () {
  const resources = {};
  const addStore = function (store) {
    if (!store) return;
    _.forEach(store, (amount, resourceType) => {
      if (typeof amount === 'number') {
        resources[resourceType] = (resources[resourceType] || 0) + amount;
      }
    });
  };

  _.forEach(TARGET_ROOMS, roomName => {
    const room = Game.rooms[roomName];
    if (!room) return;
    _.forEach(room.find(FIND_STRUCTURES), structure => addStore(structure.store));
    _.forEach(room.find(FIND_MY_CREEPS), creep => addStore(creep.store));
    _.forEach(room.find(FIND_DROPPED_RESOURCES), resource => {
      resources[resource.resourceType] = (resources[resource.resourceType] || 0) + resource.amount;
    });
    _.forEach(room.find(FIND_TOMBSTONES), tombstone => addStore(tombstone.store));
    _.forEach(room.find(FIND_RUINS), ruin => addStore(ruin.store));
  });
  return resources;
};

const trackNewCreeps = function () {
  const experiment = Memory.logisticsExperiment;
  _.forEach(Game.creeps, creep => {
    if (!experiment.knownCreeps[creep.name]) {
      experiment.knownCreeps[creep.name] = Game.time;
      add('spawnEnergy', bodyCost(creep.body));
      experiment.counters.creepsSpawned = (experiment.counters.creepsSpawned || 0) + 1;
    }
  });
};

const trackLorryCapacity = function () {
  const experiment = Memory.logisticsExperiment;
  _.forEach(TARGET_ROOMS, roomName => {
    const room = Game.rooms[roomName];
    if (!room) return;
    const lorries = room.find(FIND_MY_CREEPS, {
      filter: creep => creep.memory.role === 'lorry' && !creep.memory.linkRelay
    });
    const capacity = _.sum(lorries, creep => creep.store.getCapacity());
    const used = _.sum(lorries, creep => creep.store.getUsedCapacity());
    const roomStats = experiment.lorryTicks[roomName] ||
      (experiment.lorryTicks[roomName] = { count: 0, capacity: 0, used: 0, ticks: 0 });
    roomStats.count += lorries.length;
    roomStats.capacity += capacity;
    roomStats.used += used;
    roomStats.ticks += 1;
  });
};

const makeSample = function () {
  const experiment = Memory.logisticsExperiment;
  const inventory = collectInventory();
  const energyGain = (inventory[RESOURCE_ENERGY] || 0) -
    (experiment.initialInventory[RESOURCE_ENERGY] || 0);
  const totalEnergyExpense = experiment.counters.harvestedEnergy - energyGain +
    experiment.initialCreepEnergy;
  const knownExpense = experiment.counters.spawnEnergy + experiment.counters.renewEnergy +
    experiment.counters.repairEnergy + experiment.counters.buildEnergy +
    experiment.counters.upgradeEnergy + experiment.counters.towerEnergy +
    experiment.counters.terminalEnergy;
  const mineralNet = {};
  _.forEach(experiment.counters.harvestedMinerals, (amount, resourceType) => {
    mineralNet[resourceType] = (inventory[resourceType] || 0) -
      (experiment.initialInventory[resourceType] || 0);
  });
  return {
    tick: Game.time,
    elapsed: Game.time - experiment.startTick,
    inventory: inventory,
    harvestedEnergy: experiment.counters.harvestedEnergy,
    harvestedMinerals: Object.assign({}, experiment.counters.harvestedMinerals),
    mineralNet: mineralNet,
    energyNet: energyGain,
    totalEnergyExpense: totalEnergyExpense,
    knownEnergyExpense: knownExpense,
    otherEnergyExpense: totalEnergyExpense - knownExpense,
    counters: Object.assign({}, experiment.counters),
    lorryTicks: JSON.parse(JSON.stringify(experiment.lorryTicks))
  };
};

const initialize = function () {
  const experiment = Memory.logisticsExperiment;
  if (!experiment || !experiment.enabled || experiment.initialized) return;
  experiment.initialized = true;
  experiment.startTick = Game.time;
  experiment.sampleInterval = experiment.sampleInterval || 500;
  experiment.duration = experiment.duration || 15000;
  experiment.counters = {
    harvestedEnergy: 0,
    harvestedMinerals: {},
    spawnEnergy: 0,
    renewEnergy: 0,
    repairEnergy: 0,
    buildEnergy: 0,
    upgradeEnergy: 0,
    towerEnergy: 0,
    terminalEnergy: 0,
    lorryEnergyDelivered: 0,
    lorryMineralsDelivered: 0,
    creepsSpawned: 0
  };
  experiment.knownCreeps = {};
  _.forEach(Game.creeps, creep => {
    experiment.knownCreeps[creep.name] = Game.time;
    experiment.counters.spawnEnergy += bodyCost(creep.body);
  });
  experiment.initialCreepEnergy = experiment.counters.spawnEnergy;
  experiment.lorryTicks = {};
  experiment.initialInventory = collectInventory();
  experiment.samples = [makeSample()];
};

const beginTick = function () {
  if (!Memory.logisticsExperiment || !Memory.logisticsExperiment.enabled) return;
  installHooks();
  initialize();
};

const endTick = function () {
  const experiment = Memory.logisticsExperiment;
  if (!experiment || !experiment.enabled || !experiment.initialized) return;
  if (experiment.completed) return;
  trackNewCreeps();
  trackLorryCapacity();
  const elapsed = Game.time - experiment.startTick;
  if (elapsed > 0 && elapsed % experiment.sampleInterval === 0) {
    experiment.samples.push(makeSample());
  }
  if (elapsed >= experiment.duration) {
    experiment.completed = true;
    experiment.completedTick = Game.time;
  }
};

module.exports = {
  beginTick: beginTick,
  endTick: endTick
};
