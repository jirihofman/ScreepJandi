// import modules
require('prototype.spawn')();// extra spawn functions
var roleSpawn = require('role.spawn'); // spawn behaviour
var roleFlag = require('role.flag'); // spawn behaviour
require('console_info')(); // prototype for Room
var roleHarvester = require('role.harvester') ;
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRepairer = require('role.repairer');
var roleWallRepairer = require('role.wallRepairer');
var roleLongDistanceHarvester = require('role.longDistanceHarvester');
var roleLongDistanceWorker = require('role.longDistanceWorker');
var roleClaimer = require('role.claimer');
var roleMiner = require('role.miner');
var roleLorry = require('role.lorry');
var roleLorryEnergy = require('role.lorry_energy');
var roleAttacker = require('role.attacker');
var roleThief = require('role.thief');
var roleScout = require('role.scout');
var roleTower = require('role.tower');
var roleClaimToBuild = require('role.claimToBuild');
var roomPlanner = require('room.planner');
var roomUpgradeMode = require('room.upgradeMode');

console.log('-------- Loaded main.js! Happy Screeping!');

const W13N54_LINK_RELAY = {
  room: 'W13N54',
  sourceLinkId: '6a2665b94350a7c7abc91fc2',
  storageLinkId: '69134db5fa39d052668f3ab4'
};

const UO_STOCKPILE = {
  mainRoom: 'W13N54',
  supportRoom: 'W14N53',
  secondsPerTick: 3.0,
  days: 3,
  transferBatch: 500,
  labLoadTarget: 2000,
  labDrainThreshold: 500,
  labs: {
    product: '69150a6b19a68026a54e5c43',
    utrium: '6923b9afffd2ab6bd3de6cd0',
    oxygen: '6923ef5abb5c2575a38ade0c'
  }
};
const W13_UTRIUM_MINERAL_ID = '59f1c0d77d0b3d79de5f0dc2';
const W13_UTRIUM_BOOST_RESERVE = 10 * LAB_BOOST_MINERAL;

const getStoreAmount = function (structure, resourceType) {
  if (!structure || !structure.store) {
    return 0;
  }
  return structure.store[resourceType] || 0;
};

const getFreeStoreCapacity = function (structure, resourceType) {
  if (!structure || !structure.store) {
    return 0;
  }
  if (structure.store.getFreeCapacity) {
    return structure.store.getFreeCapacity(resourceType) || 0;
  }
  if (structure.storeCapacity) {
    return Math.max(0, structure.storeCapacity - _.sum(structure.store));
  }
  return 0;
};

const getLabAmount = function (lab, resourceType) {
  if (!lab || lab.mineralType !== resourceType) {
    return 0;
  }
  return lab.mineralAmount || 0;
};

const getLabFreeCapacity = function (lab, resourceType) {
  if (!lab || (lab.mineralType && lab.mineralType !== resourceType)) {
    return 0;
  }
  if (lab.store && lab.store.getFreeCapacity) {
    return lab.store.getFreeCapacity(resourceType) || 0;
  }
  return Math.max(0, LAB_MINERAL_CAPACITY - (lab.mineralAmount || 0));
};

const getRoomStoredAmount = function (room, resourceType) {
  if (!room) {
    return 0;
  }
  return getStoreAmount(room.storage, resourceType) + getStoreAmount(room.terminal, resourceType);
};

const getRoomCarriedAmount = function (room, resourceType) {
  if (!room) {
    return 0;
  }
  return _.sum(room.find(FIND_MY_CREEPS), c => c.carry[resourceType] || 0);
};

const roomUsesSplitLogistics = function (room) {
  return room &&
    room.controller &&
    room.controller.level === 8 &&
    room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_LAB &&
        (s.mineralType || s.mineralAmount > 0)
    }).length > 0;
};

const isMineralTaskLorry = function (creep, splitLogistics) {
  return creep.memory.role === 'lorry' &&
    !creep.memory.linkRelay &&
    !creep.memory.mineralPickup &&
    creep.memory.to_recycle !== 1 &&
    (!splitLogistics || creep.memory.logisticsType === 'mineral');
};

const assignMineralLorryTask = function (room, source, target, mineralType) {
  const splitLogistics = roomUsesSplitLogistics(room);
  const existingHaulers = room.find(FIND_MY_CREEPS, {
    filter: c => isMineralTaskLorry(c, splitLogistics) &&
      c.memory._task &&
      c.memory._task.id_from === source.id &&
      c.memory._task.mineral_type === mineralType
  });
  if (existingHaulers.length > 0) {
    return;
  }

  const availableLorry = _.sortBy(room.find(FIND_MY_CREEPS, {
    filter: c => isMineralTaskLorry(c, splitLogistics) &&
      !c.memory._task &&
      !c.memory.working &&
      _.sum(c.carry) === 0
  }), c => c.pos.getRangeTo(source))[0];
  if (!availableLorry) {
    return;
  }

  availableLorry.memory._task = {
    id_from: source.id,
    id_to: target.id,
    mineral_type: mineralType,
    restoreWorking: availableLorry.memory.working,
    restoreMaxed: availableLorry.memory.maxed,
    timeout: 120
  };
  availableLorry.memory.working = false;
};

const assignLorryTransferTask = function (room, source, target, mineralType, amount, timeout) {
  if (!room || !source || !target || !mineralType || amount <= 0) {
    return false;
  }
  const splitLogistics = roomUsesSplitLogistics(room);

  const existingHaulers = room.find(FIND_MY_CREEPS, {
    filter: c => isMineralTaskLorry(c, splitLogistics) &&
      c.memory._task &&
      c.memory._task.id_from === source.id &&
      c.memory._task.id_to === target.id &&
      c.memory._task.mineral_type === mineralType
  });
  if (existingHaulers.length > 0) {
    return true;
  }

  let availableLorry = _.sortBy(room.find(FIND_MY_CREEPS, {
    filter: c => isMineralTaskLorry(c, splitLogistics) &&
      !c.memory._task &&
      !c.memory.working &&
      _.sum(c.carry) === 0
  }), c => c.pos.getRangeTo(source))[0];
  if (!availableLorry && room.storage) {
    availableLorry = _.sortBy(room.find(FIND_MY_CREEPS, {
      filter: c => isMineralTaskLorry(c, splitLogistics) &&
        !c.memory._task &&
        _.sum(c.carry) > 0 &&
        (c.carry[RESOURCE_ENERGY] || 0) === _.sum(c.carry)
    }), c => c.pos.getRangeTo(source))[0];
  }
  if (!availableLorry) {
    return false;
  }

  availableLorry.memory._task = {
    id_from: source.id,
    id_to: target.id,
    mineral_type: mineralType,
    amount: amount,
    mode: 'terminal_to_storage',
    once: true,
    restoreWorking: availableLorry.memory.working,
    restoreMaxed: availableLorry.memory.maxed,
    timeout: timeout || 180
  };
  availableLorry.memory.working = false;
  availableLorry.memory.maxed = false;
  return true;
};

const getUoStockpileTarget = function () {
  return Math.ceil(
    (UO_STOCKPILE.days * 24 * 60 * 60 / UO_STOCKPILE.secondsPerTick) *
    HARVEST_MINERAL_POWER /
    EXTRACTOR_COOLDOWN
  );
};

const findRoomResourceSource = function (room, resourceType) {
  if (getStoreAmount(room.terminal, resourceType) > 0) {
    return room.terminal;
  }
  if (getStoreAmount(room.storage, resourceType) > 0) {
    return room.storage;
  }
  return null;
};

const drainLabToStockpile = function (room, lab, target, minAmount) {
  if (!room || !lab || !target || !lab.mineralType || lab.mineralAmount <= 0 || lab.mineralAmount < minAmount) {
    return false;
  }
  return assignLorryTransferTask(
    room,
    lab,
    target,
    lab.mineralType,
    Math.min(UO_STOCKPILE.transferBatch, lab.mineralAmount),
    220
  );
};

const isW13UtriumMiningActive = function () {
  const mineral = Game.getObjectById(W13_UTRIUM_MINERAL_ID);
  const operationMemory = Memory.rooms &&
    Memory.rooms[UO_STOCKPILE.mainRoom] &&
    Memory.rooms[UO_STOCKPILE.mainRoom].w13UtriumOperation;
  return mineral &&
    mineral.mineralAmount >= 10 &&
    !(operationMemory && operationMemory.done);
};

const loadLabFromStockpile = function (room, lab, resourceType, maxUsefulAmount) {
  if (!room || !lab || maxUsefulAmount <= 0) {
    return false;
  }
  if (lab.mineralType && lab.mineralType !== resourceType) {
    return false;
  }

  const current = getLabAmount(lab, resourceType);
  if (current >= UO_STOCKPILE.labLoadTarget) {
    return false;
  }

  const source = findRoomResourceSource(room, resourceType);
  if (!source) {
    return false;
  }

  const amount = Math.min(
    UO_STOCKPILE.transferBatch,
    UO_STOCKPILE.labLoadTarget - current,
    maxUsefulAmount,
    getLabFreeCapacity(lab, resourceType),
    getStoreAmount(source, resourceType)
  );
  if (amount <= 0) {
    return false;
  }

  return assignLorryTransferTask(room, source, lab, resourceType, amount, 220);
};

const getAffordableSendAmount = function (terminal, amount, destinationRoom) {
  let sendAmount = amount;
  while (sendAmount > 0 &&
      Game.market.calcTransactionCost(sendAmount, terminal.room.name, destinationRoom) > getStoreAmount(terminal, RESOURCE_ENERGY)) {
    sendAmount = Math.floor(sendAmount / 2);
  }
  return sendAmount;
};

const moveSupportOxygenToMain = function (supportRoom, mainRoom, amountNeeded) {
  if (!supportRoom || !mainRoom || amountNeeded <= 0 || !supportRoom.terminal || !mainRoom.terminal) {
    return;
  }

  let sentAmount = 0;
  const supportTerminalO = getStoreAmount(supportRoom.terminal, RESOURCE_OXYGEN);
  if (supportTerminalO > 0 && supportRoom.terminal.cooldown === 0) {
    const mainTerminalFree = getFreeStoreCapacity(mainRoom.terminal, RESOURCE_OXYGEN);
    let amount = Math.min(supportTerminalO, amountNeeded, mainTerminalFree);
    amount = getAffordableSendAmount(supportRoom.terminal, amount, mainRoom.name);
    if (amount > 0) {
      const result = supportRoom.terminal.send(RESOURCE_OXYGEN, amount, mainRoom.name);
      if (result === OK) {
        sentAmount = amount;
      } else if (result !== ERR_TIRED) {
        console.log('UO stockpile oxygen send failed: ', result, amount);
      }
    }
  }

  const remainingNeed = Math.max(0, amountNeeded - sentAmount - getStoreAmount(supportRoom.terminal, RESOURCE_OXYGEN));
  const amountToStage = Math.min(
    UO_STOCKPILE.transferBatch,
    remainingNeed,
    getStoreAmount(supportRoom.storage, RESOURCE_OXYGEN),
    getFreeStoreCapacity(supportRoom.terminal, RESOURCE_OXYGEN)
  );
  if (amountToStage > 0) {
    assignLorryTransferTask(
      supportRoom,
      supportRoom.storage,
      supportRoom.terminal,
      RESOURCE_OXYGEN,
      amountToStage,
      220
    );
  }
};

const runUoStockpileController = function () {
  const mainRoom = Game.rooms[UO_STOCKPILE.mainRoom];
  const supportRoom = Game.rooms[UO_STOCKPILE.supportRoom];
  if (!mainRoom || !supportRoom || !mainRoom.storage || !mainRoom.terminal) {
    return;
  }

  const productLab = Game.getObjectById(UO_STOCKPILE.labs.product);
  const utriumLab = Game.getObjectById(UO_STOCKPILE.labs.utrium);
  const oxygenLab = Game.getObjectById(UO_STOCKPILE.labs.oxygen);
  if (!productLab || !utriumLab || !oxygenLab) {
    return;
  }

  const targetUo = getUoStockpileTarget();
  const stockpileUo = getRoomStoredAmount(mainRoom, RESOURCE_UTRIUM_OXIDE);
  const productLabUo = getLabAmount(productLab, RESOURCE_UTRIUM_OXIDE);
  const carriedUo = getRoomCarriedAmount(mainRoom, RESOURCE_UTRIUM_OXIDE);
  const targetStorage = mainRoom.storage || mainRoom.terminal;
  const w13UtriumMiningActive = isW13UtriumMiningActive();

  if (utriumLab.mineralType && utriumLab.mineralType !== RESOURCE_UTRIUM) {
    drainLabToStockpile(mainRoom, utriumLab, targetStorage, 1);
    return;
  }
  if (oxygenLab.mineralType && oxygenLab.mineralType !== RESOURCE_OXYGEN) {
    drainLabToStockpile(mainRoom, oxygenLab, targetStorage, 1);
    return;
  }
  if (productLab.mineralType && productLab.mineralType !== RESOURCE_UTRIUM_OXIDE) {
    drainLabToStockpile(mainRoom, productLab, targetStorage, 1);
    return;
  }

  if (w13UtriumMiningActive &&
      productLabUo < W13_UTRIUM_BOOST_RESERVE &&
      getRoomStoredAmount(mainRoom, RESOURCE_UTRIUM_OXIDE) > 0 &&
      loadLabFromStockpile(
        mainRoom,
        productLab,
        RESOURCE_UTRIUM_OXIDE,
        W13_UTRIUM_BOOST_RESERVE - productLabUo
      )) {
    return;
  }

  if (stockpileUo >= targetUo || stockpileUo + productLabUo + carriedUo >= targetUo) {
    if (!w13UtriumMiningActive) {
      drainLabToStockpile(mainRoom, productLab, targetStorage, 1);
    }
    drainLabToStockpile(mainRoom, utriumLab, targetStorage, 1);
    drainLabToStockpile(mainRoom, oxygenLab, targetStorage, 1);
    return;
  }

  const mainOxygenAvailable = getRoomStoredAmount(mainRoom, RESOURCE_OXYGEN) +
    getLabAmount(oxygenLab, RESOURCE_OXYGEN) +
    getRoomCarriedAmount(mainRoom, RESOURCE_OXYGEN);
  const oxygenNeeded = Math.max(0, targetUo - stockpileUo - productLabUo - carriedUo - mainOxygenAvailable);
  moveSupportOxygenToMain(supportRoom, mainRoom, oxygenNeeded);

  const remainingAfterProduct = Math.max(0, targetUo - stockpileUo - productLabUo - carriedUo);
  loadLabFromStockpile(mainRoom, utriumLab, RESOURCE_UTRIUM, remainingAfterProduct);
  loadLabFromStockpile(mainRoom, oxygenLab, RESOURCE_OXYGEN, remainingAfterProduct);

  if (!w13UtriumMiningActive &&
      (productLabUo >= UO_STOCKPILE.labDrainThreshold ||
      getLabFreeCapacity(productLab, RESOURCE_UTRIUM_OXIDE) < LAB_REACTION_AMOUNT)) {
    drainLabToStockpile(mainRoom, productLab, targetStorage, UO_STOCKPILE.labDrainThreshold);
  }

  if (Game.time % REACTION_TIME[RESOURCE_UTRIUM_OXIDE] !== 0 ||
      productLab.cooldown > 0 ||
      getLabAmount(utriumLab, RESOURCE_UTRIUM) < LAB_REACTION_AMOUNT ||
      getLabAmount(oxygenLab, RESOURCE_OXYGEN) < LAB_REACTION_AMOUNT ||
      getLabFreeCapacity(productLab, RESOURCE_UTRIUM_OXIDE) < LAB_REACTION_AMOUNT) {
    return;
  }

  const result = productLab.runReaction(utriumLab, oxygenLab);
  if (result !== OK && result !== ERR_TIRED && result !== ERR_NOT_ENOUGH_RESOURCES && result !== ERR_FULL) {
    console.log('UO stockpile reaction failed: ', result);
  }
};

module.exports.loop = function () {
  // console.log('loop start - tick ', Game.time);

  // REMOVE me
  if (Game.time % 1500 === 0 || Game.time % 1500 === 750) {
      // Game.spawns['Spawn1'].createCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], null, { role: 'lorry', working: true })
  }
  if (Game.time % 13 === 0) {
    // var d = Game.creeps['SlowUp2'].pos.lookFor(LOOK_RESOURCES)[0]; d && Game.creeps['SlowUp2'].pickup(d);
}
  if (Game.time % 13 === 1) {
    // Game.creeps['SlowUp2'].transfer(Game.getObjectById('690e0919f9273257a6fa10ff'), RESOURCE_ENERGY);
}
  if (Game.time % 10 === 0) {
      // Game.creeps['SlowUp2'].transfer(Game.getObjectById('69111c74d47054001236181a'), RESOURCE_ENERGY);
      try {
          Game.creeps['SlowUp1'].transfer(Game.getObjectById('690ddda490f3c4295b91db76'), RESOURCE_ENERGY);
      } catch {
          console.log("failed slowup1")
      }
  }

  // Defender spawning disabled; recycle attacker-role defenders manually when retiring them.
  if (false && Game.time % 75 === 0) {
    // Check if Defender1 exists
    if (!Game.creeps['Defender1']) {
      Game.spawns['Spawn1'].createCreep([
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
      ], 'Defender1', { role: 'attacker' });
    } else if (!Game.creeps['Defender2']) {
      // ~2200 energy cost
      // tough: 10, move: 50, heal: 250, ranged_attack: 150, attack: 80
      Game.spawns['Spawn1'].createCreep([TOUGH, MOVE, ATTACK], 'Defender2', { role: 'attacker' });
    }
  }


// - every 5th tick - transfer energy to Kaelyn
if (Game.time % 5 === 0) {
//    Game.creeps['SlowUp2'].transfer(Game.creeps['Anna'], RESOURCE_ENERGY);
}
// - always build
//Game.creeps['Anna'].build(Game.getObjectById('690de8e5d470540012351325'));
  
  
  
  /* used CPU */
  let l_cpu = {
    creeps: 0,
    spawns: 0,
    towers: 0,
    flags:  0
  };
  // check for memory entries of died creeps by iterating over Memory.creeps
  for (let name in Memory.creeps) {
    // and checking if the creep is still alive
    if (!Game.creeps[name]) {
      // if not, delete the memory entry
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  // Clean up memory for removed claim flags
  if (Memory.claimFlags) {
    for (let flagName in Memory.claimFlags) {
      if (!Game.flags[flagName]) {
        delete Memory.claimFlags[flagName];
        console.log('Clearing non-existing claim flag memory:', flagName);
      }
    }
  }

  /* MINERAL lorries every 300 */
  if (Game.time % 1480 === 0 || Game.time % 1400 === 1 || Game.time % 1480 === 2 || Game.time % 1480 === 3 || Game.time % 1480 === 4){
    //Game.spawns.Spawn3.createCreep([ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE], 'ccc', {role: 'attacker', target: 'E98N69'});
    //Game.spawns.Spawn4.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,], 'hahaha', {role: 'attacker', target: 'E99N69'}); // 36 parts
    //let b = Game.spawns.Spawn6.createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, HEAL, MOVE, MOVE, HEAL], null ,{role: 'attacker', target: 'E8N32', home: 'E7N32', b: true})
    //new RoomVisual("E7N32").text('Buzeruju: ' + b, 10, 10, {align: 'left'});
  }


  /* LINKS. TODO: every 11 ticks maybe enough */
  if (Game.time % 6 === 0){
    const relaySource = Game.getObjectById(W13N54_LINK_RELAY.sourceLinkId);
    const relayTarget = Game.getObjectById(W13N54_LINK_RELAY.storageLinkId);
    if (relaySource && relayTarget && relaySource.energy > 0 && relayTarget.energy < relayTarget.energyCapacity) {
      let r = relaySource.transferEnergy(relayTarget);
      if (r !== 0 && r !== ERR_TIRED && r !== ERR_FULL) {
        console.log('W13N54 relay link [error] ', relaySource, ' transfering', relaySource.energy, ' energy to ', relayTarget, r);
      }
    }
    _.each(Game.flags, (v, k)=>{
      let l_cpu_used = Game.cpu.getUsed();
      if(Game.flags[k].color===COLOR_YELLOW && Game.flags[k].secondaryColor===COLOR_RED){
        let target = Game.flags[k].room.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LINK && !s.pos.isEqualTo(v.pos) && _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && s.pos.isEqualTo(c.pos))});
        let source = Game.flags[k].room.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LINK && s.pos.isEqualTo(v.pos)});
        if (source[0] && source[0].energy > 200){
          let r = Game.getObjectById(source[0].id).transferEnergy(target[0]);
          if (r!==0 && r!==ERR_TIRED && r!==ERR_FULL){
            console.log('Link [error] ', source[0], ' transfering', source[0].energy, ' energy to ', target, r);
          }
        }
      }
      l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
      l_cpu.flags+= l_cpu_used;
    });
  }
  // for every creep name in Game.creeps
  for (let name in Game.creeps) {
    let l_cpu_used = Game.cpu.getUsed();
    var creep = Game.creeps[name]; // get the creep object

    // if creep is harvester, call harvester script
    if (creep.memory.role === 'harvester') {
      roleHarvester.run(creep);
    }
    // if creep is upgrader, call upgrader script
    else if (creep.memory.role === 'upgrader') {
      roleUpgrader.run(creep);
    }
    // if creep is builder, call builder script
    else if (creep.memory.role === 'builder') {
      roleBuilder.run(creep);
    }
    // if creep is repairer, call repairer script
    else if (creep.memory.role === 'repairer') {
      roleRepairer.run(creep);
    }
    // if creep is wallRepairer, call wallRepairer script
    else if (creep.memory.role === 'wallRepairer') {
      roleWallRepairer.run(creep);
    }
    // if creep is longDistanceHarvester, call longDistanceHarvester script
    else if (creep.memory.role === 'longDistanceHarvester') {
      roleLongDistanceHarvester.run(creep);
    }
    else if (creep.memory.role === 'longDistanceWorker') {
      roleLongDistanceWorker.run(creep);
    }
    // if creep is claimer, call claimer script
    else if (creep.memory.role === 'claimer') {
      roleClaimer.run(creep);
    }
    // if creep is miner, call miner script
    else if (creep.memory.role === 'miner') {
      roleMiner.run(creep);
    }
    // if creep is lorry, call miner lorry
    else if (creep.memory.role === 'lorry') {
      roleLorry.run(creep);
    }
    // if creep is lorry_energy, call energy transfer lorry
    else if (creep.memory.role === 'lorry_energy') {
      roleLorryEnergy.run(creep);
    }
    // if creep is attacker, call attacker script
    else if (creep.memory.role === 'attacker') {
      roleAttacker.run(creep);
    }
    else if (creep.memory.role === 'thief') {
      roleThief.run(creep);
    }
    else if (creep.memory.role === 'scout') {
      roleScout.run(creep);
    }
    // claim-to-build roles
    else if (creep.memory.role === 'claimToBuildUpgrader') {
      roleClaimToBuild.runClaimToBuildUpgrader(creep);
    }
    else if (creep.memory.role === 'claimToBuildBuilder') {
      roleClaimToBuild.runClaimToBuildBuilder(creep);
    }

    // self recycle
    if (creep.memory.to_recycle === 1){
      let l_spawn = creep.room.find(FIND_MY_SPAWNS)[0];
      if (!l_spawn && creep.memory.home){
        /* cant find spawn in this room, try home */
        l_spawn = creep.room.findExitTo(creep.memory.home);
        console.log('Recycling self, moving to exit: ', creep.pos);
      }
      let r = creep.moveTo(l_spawn);
      if (r===0){
        creep.say('🚫');
      } else {
        creep.say('Error ' + r);
      }
    }

    if (creep.memory._alive){
      creep.memory._alive++;
    } else {
      creep.memory._alive = 1;
    }

    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.creeps+= l_cpu_used;
    //console.log(name, l_cpu_used);
  }

  // find all my towers
  /* Priorities: ATTACK, REPAIR, ... */
  var towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);
  // for each tower
  for (let tower of towers) {
    let l_cpu_used = Game.cpu.getUsed();
    roleTower.run(tower);
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.towers+= l_cpu_used;
  }

  // iterate over all the spawns
  for (let spawnName in Game.spawns) {
    let spawn = Game.spawns[spawnName];
    let l_cpu_used = Game.cpu.getUsed();
    roleSpawn.run(spawn);
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.spawns+= l_cpu_used;
  }

  // run claim-to-build orchestrator
  if (Game.time % 5 === 0) {
    roleClaimToBuild.runAll();
  }

  // iterate over all the flags
  for (let flagName in Game.flags) {
    let flag = Game.flags[flagName];
    let l_cpu_used = Game.cpu.getUsed();
    
    // Check for claim-to-build flag (COLOR_PURPLE + COLOR_PURPLE)
    if (flag.color === COLOR_PURPLE && flag.secondaryColor === COLOR_PURPLE) {
      // Initialize claim-to-build operation
      let sourceRoom = roleClaimToBuild.findSourceRoom(flag.pos.roomName);
      if (sourceRoom) {
        roleClaimToBuild.initializeClaimToBuild(flag, sourceRoom);
        console.log('Initialized claim-to-build for', flag.pos.roomName, 'from', sourceRoom);
        flag.remove(); // Remove flag after initialization
      }
    }
    // Check for simple claim flag (COLOR_ORANGE + COLOR_ORANGE)
    else if (flag.color === COLOR_ORANGE && flag.secondaryColor === COLOR_ORANGE) {
      // Track claim flag in Memory - we'll use this for spawning claimers
      if (!Memory.claimFlags) Memory.claimFlags = {};
      Memory.claimFlags[flag.name] = {
        roomName: flag.pos.roomName,
        name: flag.name
      };
    }
    else {
      roleFlag.run(flag);
    }
    
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.flags+= l_cpu_used;
    //console.log('Spawn: ', spawnName, l_cpu_used);
  }

  for (let ro in Game.rooms) {
    let r = Game.rooms[ro];

    // Defender spawning disabled.
    if (false && Game.time % 5 === 0 && r.controller && r.controller.my) {
      // Find hostile creeps with more than 20 attack, ranged attack, or heal parts
      const strongHostiles = r.find(FIND_HOSTILE_CREEPS, {
        filter: (creep) => {
          const attackParts = creep.getActiveBodyparts(ATTACK);
          const rangedParts = creep.getActiveBodyparts(RANGED_ATTACK);
          const healParts = creep.getActiveBodyparts(HEAL);
          return attackParts > 20 || rangedParts > 20 || healParts > 20;
        }
      });

      // If strong hostiles detected, spawn defenders if we don't already have enough
      if (strongHostiles.length > 0) {
        const defenders = r.find(FIND_MY_CREEPS, {
          filter: (c) => c.memory.role === 'attacker'
        });
        
        // Count how many defenders are already in the room or being spawned
        const defendersInRoom = defenders.length;
        const spawnsInRoom = r.find(FIND_MY_SPAWNS);
        
        // Spawn additional defenders if we have fewer than 3 per strong hostile (max 6 total)
        const desiredDefenders = Math.min(strongHostiles.length * 3, 6);
        
        if (defendersInRoom < desiredDefenders && spawnsInRoom.length > 0) {
          const spawn = spawnsInRoom[0];
          
          // Don't spawn if already spawning something
          if (!spawn.spawning && spawn.room.energyAvailable >= 1350) {
            console.log('Strong hostile detected in', r.name, '- spawning emergency defender');
            // Spawn a defensive attacker
            // Cost: 6×10 + 6×50 + 3×250 + 3×80 = 60 + 300 + 750 + 240 = 1350 energy
            spawn.createCreep([
              TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
              MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
              HEAL, HEAL, HEAL,
              ATTACK, ATTACK, ATTACK
            ], undefined, { role: 'attacker' });
          }
        }
      }
    }

    if (Game.time % 10 === 0 && r.controller && r.controller.owner && r.controller.owner.username === 'Jenjandi'){
      roomPlanner.plan(r);
    }

    /* minerals */
    //console.log(r, r.controller.progressTotal - r.controller.progress, r.controller.level)
    if (Game.time % 200 === 0 && r.controller && r.controller.owner && r.controller.owner.username === 'Jenjandi'){
      if (r.name === 'E7N33'){
        r.terminal.send(RESOURCE_ENERGY, 1000, 'E6N39');
      }
      if (r.name === 'E8N32'){
        r.terminal.send(RESOURCE_ENERGY, 4500, 'E7N44');
      }
      if (r.name === 'E9N36'){
        r.terminal.send(RESOURCE_ENERGY, 2000, 'E3N42');
      }
      if (r.name === 'E8N39'){
        r.terminal.send(RESOURCE_ENERGY, 2000, 'E6N39');
      }
      if (r.name === 'E7N33'){
        r.terminal.send(RESOURCE_ENERGY, 2000, 'E3N42');
      }
      if (r.name === 'E6N39'){
        r.terminal.send(RESOURCE_ENERGY, 2000, 'E7N44');
      }
      if (r.name === 'E7N31'){
        r.terminal.send(RESOURCE_ENERGY, 5000, 'E3N42');
      }
    }

    if (Game.time % 400 === 0 && r.controller && r.controller.owner && r.controller.owner.username === 'Jenjandi'){

      let l_mineral_source = r.find(FIND_MINERALS)[0];
      if (!l_mineral_source) {
        continue;
      }
      let l_mineral = l_mineral_source.mineralType;
      let l_store_mineral_in_storage = r.name === 'W14N53' && l_mineral === RESOURCE_OXYGEN && r.storage;
      let l_mineral_target = l_store_mineral_in_storage ? r.storage : (r.terminal || r.storage);
      if (!l_mineral_target) {
        continue;
      }
      let l_container_threshold = l_store_mineral_in_storage ? 1800 : 1000;
      //_.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{l.drop(l_mineral);});
      if (_.size(r.find(FIND_STRUCTURES, {filter: c=>c.structureType===STRUCTURE_CONTAINER && c.store[l_mineral] >= l_container_threshold})) > 0){
        let budovy = r.find(FIND_STRUCTURES, {filter: c=>(c.structureType===STRUCTURE_CONTAINER && c.store[l_mineral] >= l_container_threshold) || (c.structureType===STRUCTURE_LAB && c.mineralAmount > 1000)});
        assignMineralLorryTask(r, budovy[0], l_mineral_target, l_mineral);
      } else if (false) { // TODO: unfake
        /* muzu davat neco do laboratori? */
        if (r.terminal.store[RESOURCE_LEMERGIUM] > 99 && _.size(r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_LEMERGIUM || s.id==='59c279de62e14971c6c026e9') && s.mineralAmount < 750*3}))){
          /* TODO - zrusit each, cyklus pres mineraly, pole laboratori do promenne */
          _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{
            l.drop(RESOURCE_ENERGY); l.memory._task = {id_from: r.terminal.id, id_to: r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_LEMERGIUM || s.id==='59c279de62e14971c6c026e9') && s.mineralAmount < 750*3})[0].id, mineral_type: RESOURCE_LEMERGIUM, amount: 100}; l.memory.working=false;
          });
        } else if (r.terminal.store[RESOURCE_KEANIUM] > 99 && _.size(r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_KEANIUM || s.id==='59c2856595498a470110e5f8') && s.mineralAmount < 750*3}))){
          /* TODO - zrusit each, cyklus pres mineraly, pole laboratori do promenne */
          _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{
            l.drop(RESOURCE_ENERGY); l.memory._task = {id_from: r.terminal.id, id_to: r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_KEANIUM || s.id==='59c2856595498a470110e5f8') && s.mineralAmount < 750*3})[0].id, mineral_type: RESOURCE_KEANIUM, amount: 100}; l.memory.working=false;
          });
        } else if (r.terminal.store[RESOURCE_UTRIUM] > 99 && _.size(r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_UTRIUM || s.id==='59c2727ab7398c58a1376c18') && s.mineralAmount < 750*3}))){
          /* TODO - zrusit each, cyklus pres mineraly, pole laboratori do promenne */
          _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{
            l.drop(RESOURCE_ENERGY); l.memory._task = {id_from: r.terminal.id, id_to: r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_UTRIUM || s.id==='59c2727ab7398c58a1376c18') && s.mineralAmount < 750*3})[0].id, mineral_type: RESOURCE_UTRIUM, amount: 100}; l.memory.working=false;
          });
        } else if (r.terminal.store[RESOURCE_ZYNTHIUM] > 99 && _.size(r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_ZYNTHIUM || s.id === '59c2a0180adae21571733a48') && s.mineralAmount < 750*3}))){
          /* TODO - zrusit each, cyklus pres mineraly, pole laboratori do promenne */
          _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{
            l.drop(RESOURCE_ENERGY); l.memory._task = {id_from: r.terminal.id, id_to: r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && (s.mineralType === RESOURCE_ZYNTHIUM || s.id === '59c2a0180adae21571733a48') && s.mineralAmount < 750*3})[0].id, mineral_type: RESOURCE_ZYNTHIUM, amount: 100}; l.memory.working=false;
          });
        } else if (_.size(r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && s.mineralType === RESOURCE_GHODIUM && s.mineralAmount >= 100}))){
          /* GHODIUM BACK TO NUKER/TERMINAL */
          /* TODO - zrusit each, cyklus pres mineraly, pole laboratori do promenne */
          _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{
            let l_id = r.storage.id; // todo nuker
            if (r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_NUKER && s.ghodium <= 4800 })){
              // tady to hazi chybu Cannot read property 'id' of undefined
              l_id = r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_NUKER && s.ghodium <= 4800 })[0].id;
            }
            l.drop(RESOURCE_ENERGY); l.memory._task = {id_to: l_id, id_from: r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB && s.mineralType === RESOURCE_GHODIUM && s.mineralAmount >= 100})[0].id, mineral_type: RESOURCE_GHODIUM, amount: 100}; l.memory.working=false;
          });
        } else {
          _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{delete l.memory._task;});
        }
      }

    }

    if (r.controller && r.controller.level > 4 && r.controller.owner.username === 'Jenjandi' && Game.time % 300 === 0 && r.controller.level < 8){
      let e = r.storage.store[RESOURCE_ENERGY];
      if (e > 100000){
        // enough energy, make three builders
        Memory.rooms[r.name].creep_limit.minBuilders = 3;
      }
      if (e > 300000){
        // enough energy, make three builders
        Memory.rooms[r.name].creep_limit.minBuilders = 6;
      }
      if (e < 80000){
        Memory.rooms[r.name].creep_limit.minBuilders = 1;
      }
    }


    /* TERMINALS */
    if (Game.time % 4000 === 0){
      for(const id in Game.market.orders) {
        Game.market.cancelOrder(id);
      }
    }
    if (r.terminal && Game.time % 201 === 0){
      roomUpgradeMode.createEnergySellOrder(r);
      for (var prop in r.terminal.store) {
        if (roomUpgradeMode.isNotUpgrading8Room(r) && prop === RESOURCE_ENERGY) {
          continue;
        }
        if (r.terminal.store[prop] > 200000){
          console.log(`r.terminal.store.${prop} = ${r.terminal.store[prop]}`);
          // TODO find the right price for the mineral
          let o = 0;
          if (prop === RESOURCE_LEMERGIUM){
            o = Game.market.createOrder(ORDER_SELL, prop, 0.22, 3000, r.name);
          } else if (prop === RESOURCE_UTRIUM){
            o = Game.market.createOrder(ORDER_SELL, prop, 0.22, 3000, r.name);
          } else {
            o = Game.market.createOrder(ORDER_SELL, prop, 0.22, 3000, r.name);
          }

          console.log('selling: ', prop, o);
        }
      }
    }
  }

  if (Game.time % REACTION_TIME[RESOURCE_UTRIUM_OXIDE] === 0) {
    runUoStockpileController();
  }

  /* LABS hardcoded */
  if (Game.time % 10 === 0){
    const lab1 = Game.getObjectById('59c2aedc88d88930943de023');
    const lab2 = Game.getObjectById('59c279de62e14971c6c026e9');
    const lab3 = Game.getObjectById('59c2727ab7398c58a1376c18');
    if (lab1 && lab2 && lab3) {
      lab1.runReaction(lab2, lab3);
    }
    const lab4 = Game.getObjectById('59c292c4af5b7634b9250e60');
    const lab5 = Game.getObjectById('59c2856595498a470110e5f8');
    const lab6 = Game.getObjectById('59c2a0180adae21571733a48');
    if (lab4 && lab5 && lab6) {
      lab4.runReaction(lab5, lab6);
    }
    const lab7 = Game.getObjectById('59c2bc8b866af4107a4dfe4a');
    if (lab7 && lab4 && lab1) {
      let ghodium = lab7.runReaction(lab4, lab1);
      console.log('Ghodium try: ', ghodium);
    }
  }
  if (Game.time % 10 === 0){
    //
  }

  /* CPU used per tick */
  //console.log('====================');
  //console.log('CPU stats: ', Game.cpu.limit, Game.cpu.tickLimit, Game.cpu.bucket);
/*  console.log('CPU used per tick: ');
  console.log(' CREEPS: ', l_cpu.creeps);
  console.log(' SPAWNS: ', l_cpu.spawns);
  console.log(' TOWERS: ', l_cpu.towers);
  console.log(' FLAGS : ', l_cpu.flags);
  console.log('====================');
*/
};
