const MODE_UPGRADE_8 = 'upgrade-8';
const MODE_NOT_UPGRADING_8 = 'not-upgrading-8';

const MAINTENANCE_UPGRADER_INTERVAL = 30000;
const MAINTENANCE_DOWNGRADE_THRESHOLD = 175000;
const ENERGY_SELL_STORAGE_RESERVE = 300000;
const ENERGY_SELL_TERMINAL_RESERVE = 50000;
const ENERGY_SELL_TERMINAL_TARGET = 150000;
const ENERGY_SELL_ORDER_AMOUNT = 10000;
const ENERGY_SELL_MAX_ACTIVE = 30000;
const ENERGY_SELL_DISCOUNT = 0.95;

const roundMarketPrice = function (price) {
  return Math.max(0.001, Math.round(price * 1000) / 1000);
};

const getMode = function () {
  const configuredMode = Memory.upgrade8Mode ||
    (Memory.settings && Memory.settings.upgrade8Mode);
  return configuredMode === MODE_NOT_UPGRADING_8 ? MODE_NOT_UPGRADING_8 : MODE_UPGRADE_8;
};

const isNotUpgrading8Room = function (room) {
  return getMode() === MODE_NOT_UPGRADING_8 &&
    room.controller &&
    room.controller.my &&
    room.controller.level === 8;
};

const getMaintenanceState = function (roomName) {
  if (!Memory.upgrade8Maintenance) {
    Memory.upgrade8Maintenance = {};
  }
  if (!Memory.upgrade8Maintenance[roomName]) {
    Memory.upgrade8Maintenance[roomName] = {};
  }
  return Memory.upgrade8Maintenance[roomName];
};

const isMaintenanceUpgrader = function (creep, roomName) {
  return creep.memory &&
    creep.memory.role === 'upgrader' &&
    creep.memory.upgrade8Maintenance === true &&
    creep.memory.home === roomName &&
    creep.memory.to_recycle !== 1;
};

const hasMaintenanceUpgrader = function (room) {
  if (_.some(Game.creeps, creep => isMaintenanceUpgrader(creep, room.name))) {
    return true;
  }

  return _.some(room.find(FIND_MY_SPAWNS), spawn =>
    spawn.spawning &&
    spawn.spawning.name &&
    Game.creeps[spawn.spawning.name] &&
    isMaintenanceUpgrader(Game.creeps[spawn.spawning.name], room.name)
  );
};

const shouldSpawnMaintenanceUpgrader = function (room) {
  if (!isNotUpgrading8Room(room) || hasMaintenanceUpgrader(room)) {
    return false;
  }

  const state = getMaintenanceState(room.name);
  const dueByTime = !state.lastSpawn ||
    Game.time - state.lastSpawn >= MAINTENANCE_UPGRADER_INTERVAL;
  const dueByDowngrade = room.controller.ticksToDowngrade &&
    room.controller.ticksToDowngrade < MAINTENANCE_DOWNGRADE_THRESHOLD;

  return dueByTime || dueByDowngrade;
};

const recordMaintenanceUpgraderSpawn = function (room) {
  const state = getMaintenanceState(room.name);
  state.lastSpawn = Game.time;
};

const getEnergySellTerminalTarget = function (room) {
  if (!isNotUpgrading8Room(room) ||
      !room.storage ||
      room.storage.store[RESOURCE_ENERGY] < ENERGY_SELL_STORAGE_RESERVE) {
    return 10000;
  }

  return ENERGY_SELL_TERMINAL_TARGET;
};

const discountedEnergyMarketPrice = function () {
  const sellOrders = Game.market.getAllOrders({
    type: ORDER_SELL,
    resourceType: RESOURCE_ENERGY
  });
  const usableSellOrders = _.filter(sellOrders, order =>
    order.price > 0 &&
    order.remainingAmount >= 1000
  );
  if (usableSellOrders.length > 0) {
    const lowestSell = _.min(usableSellOrders, order => order.price);
    return roundMarketPrice(lowestSell.price * ENERGY_SELL_DISCOUNT);
  }

  const history = Game.market.getHistory(RESOURCE_ENERGY);
  if (history && history.length > 0 && history[history.length - 1].avgPrice > 0) {
    return roundMarketPrice(history[history.length - 1].avgPrice * ENERGY_SELL_DISCOUNT);
  }

  return null;
};

const activeEnergySellAmount = function (roomName) {
  return _.sum(Game.market.orders, order =>
    order.type === ORDER_SELL &&
    order.resourceType === RESOURCE_ENERGY &&
    order.roomName === roomName
      ? order.remainingAmount
      : 0
  );
};

const createEnergySellOrder = function (room) {
  if (!isNotUpgrading8Room(room) || !room.terminal) {
    return null;
  }

  const terminalEnergy = room.terminal.store[RESOURCE_ENERGY] || 0;
  const storageEnergy = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0;
  if (storageEnergy < ENERGY_SELL_STORAGE_RESERVE ||
      terminalEnergy <= ENERGY_SELL_TERMINAL_RESERVE + 1000) {
    return null;
  }

  const activeAmount = activeEnergySellAmount(room.name);
  if (activeAmount >= ENERGY_SELL_MAX_ACTIVE) {
    return null;
  }

  const price = discountedEnergyMarketPrice();
  if (!price) {
    return null;
  }

  const amount = Math.min(
    ENERGY_SELL_ORDER_AMOUNT,
    ENERGY_SELL_MAX_ACTIVE - activeAmount,
    terminalEnergy - ENERGY_SELL_TERMINAL_RESERVE
  );
  const result = Game.market.createOrder(ORDER_SELL, RESOURCE_ENERGY, price, amount, room.name);
  console.log('not-upgrading-8 energy sell order:', room.name, amount, price, result);
  return result;
};

module.exports = {
  MODE_UPGRADE_8: MODE_UPGRADE_8,
  MODE_NOT_UPGRADING_8: MODE_NOT_UPGRADING_8,
  maintenanceUpgraderBody: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
  getMode: getMode,
  isNotUpgrading8Room: isNotUpgrading8Room,
  shouldSpawnMaintenanceUpgrader: shouldSpawnMaintenanceUpgrader,
  recordMaintenanceUpgraderSpawn: recordMaintenanceUpgraderSpawn,
  isMaintenanceUpgrader: isMaintenanceUpgrader,
  getEnergySellTerminalTarget: getEnergySellTerminalTarget,
  createEnergySellOrder: createEnergySellOrder
};
