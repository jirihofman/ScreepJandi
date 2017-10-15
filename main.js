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
var roleClaimer = require('role.claimer');
var roleMiner = require('role.miner');
var roleLorry = require('role.lorry');
var roleAttacker = require('role.attacker');
var roleThief = require('role.thief');
var roomPlanner = require('room.planner');

/* used CPU */
let l_cpu = {
  creeps: 0,
  spawns: 0,
  towers: 0,
  flags:  0
};

module.exports.loop = function () {
    // check for memory entries of died creeps by iterating over Memory.creeps
  for (let name in Memory.creeps) {
    // and checking if the creep is still alive
    if (!Game.creeps[name]) {
      // if not, delete the memory entry
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
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
    // if creep is attacker, call attacker script
    else if (creep.memory.role === 'attacker') {
      roleAttacker.run(creep);
    }
    else if (creep.memory.role === 'thief') {
      roleThief.run(creep);
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
    // find closes hostile creep
    let l_cpu_used = Game.cpu.getUsed();
    var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    // if one is found...
    if (target) {
      tower.attack(target); // ...FIRE!
      if (tower.energy < 500){
          // safe mode only when it is serious
        tower.room.controller.activateSafeMode();
      }

    } else {
      var target_heal = tower.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c)=>c.hitsMax > c.hits});
      if (target_heal && Game.time % 2 === 0){
        tower.heal(target_heal);
      } else {
          // containers and ramparts. ramparts up to 220k
        var stru_to_repair = tower.pos.findInRange(FIND_STRUCTURES, 8, {filter: (s) => (s.structureType === STRUCTURE_CONTAINER && s.hits < s.hitsMax*0.7) || (s.structureType === STRUCTURE_RAMPART && s.hits < 500000 && s !== Game.getObjectById('599e838b77b4d7762ccdff1d')) || (s.structureType === STRUCTURE_WALL && s.hits < 500000)} )[0];
        var road_to_repair = tower.pos.findInRange(FIND_STRUCTURES, 8, {filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < 3640} )[0];
        let r = tower.repair(stru_to_repair || road_to_repair); // should be two ticks of repair (680)
        if (r !== 0 && r !== -6 && r !== -7){
          console.log('Error tower repairing : ', r);
        }
      }

    }
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.spawns+= l_cpu_used;
    //console.log('Tower: ', tower, l_cpu_used);
  }

  // iterate over all the spawns
  for (let spawnName in Game.spawns) {
    let spawn = Game.spawns[spawnName];
    let l_cpu_used = Game.cpu.getUsed();
    roleSpawn.run(spawn);
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.spawns+= l_cpu_used;
  }

  // iterate over all the flags
  for (let flagName in Game.flags) {
    let flag = Game.flags[flagName];
    let l_cpu_used = Game.cpu.getUsed();
    roleFlag.run(flag);
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    l_cpu.flags+= l_cpu_used;
    //console.log('Spawn: ', spawnName, l_cpu_used);
  }

  for (let ro in Game.rooms) {
    let r = Game.rooms[ro];

    if (Game.time % 20 === 0 && r.controller && r.controller.owner && r.controller.owner.username === 'Jenjandi'){
      roomPlanner.plan(r)
    }

        /* minerals */
        //console.log(r, r.controller.progressTotal - r.controller.progress, r.controller.level)
    if (Game.time % 200 === 0 && r.controller && r.controller.owner && r.controller.owner.username === 'Jenjandi'){
        if (r.name === 'E7N33'){
            r.terminal.send(RESOURCE_ENERGY, 1000, 'E6N39')
        }
        if (r.name === 'E8N32'){
            r.terminal.send(RESOURCE_ENERGY, 3000, 'E7N35')
        }
        if (r.name === 'E8N39'){
            r.terminal.send(RESOURCE_ENERGY, 2000, 'E6N39')
        }
        if (r.name === 'E7N33'){
            r.terminal.send(RESOURCE_ENERGY, 3000, 'E7N35')
        }
    }

    if (Game.time % 400 === 0 && r.controller && r.controller.owner && r.controller.owner.username === 'Jenjandi'){

      let l_mineral = r.find(FIND_MINERALS)[0].mineralType;
            //_.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{l.drop(l_mineral);});
      if (_.size(r.find(FIND_STRUCTURES, {filter: c=>c.structureType===STRUCTURE_CONTAINER && c.store[l_mineral] > 1000})) > 0){
        let budovy = r.find(FIND_STRUCTURES, {filter: c=>(c.structureType===STRUCTURE_CONTAINER && c.store[l_mineral] > 1000) || (c.structureType===STRUCTURE_LAB && c.mineralAmount > 1000)});
        let idcko = budovy[0].id;// TODO: make it generic for this 1000 loop
        _.each(r.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{
            l.drop(RESOURCE_ENERGY); l.memory._task = {id_from: idcko, id_to: r.terminal.id, mineral_type: l_mineral}; l.memory.working=false;
        });
      } else {
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
                    l_id = r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_NUKER && s.ghodium <= 4800 })[0].id
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
      for (var prop in r.terminal.store) {
        if (r.terminal.store[prop] > 230000){
          console.log(`r.terminal.store.${prop} = ${r.terminal.store[prop]}`);
            // TODO find the right prise for the mineral
          if (prop === RESOURCE_LEMERGIUM){
            let o = Game.market.createOrder(ORDER_SELL, prop, 0.25, 3000, r.name);
          } else if (prop === RESOURCE_UTRIUM){
            let o = Game.market.createOrder(ORDER_SELL, prop, 0.25, 3000, r.name);
          } else {
            let o = Game.market.createOrder(ORDER_SELL, prop, 0.25, 3000, r.name);
          }

          console.log('selling: ', prop, o);
        }
      }
    }
  }

    /* LABS hardcoded */
    if (Game.time % 10 === 0){
        Game.getObjectById("59c2aedc88d88930943de023").runReaction(Game.getObjectById("59c279de62e14971c6c026e9"), Game.getObjectById("59c2727ab7398c58a1376c18"))
        Game.getObjectById("59c292c4af5b7634b9250e60").runReaction(Game.getObjectById("59c2856595498a470110e5f8"), Game.getObjectById("59c2a0180adae21571733a48"))
        let ghodium = Game.getObjectById("59c2bc8b866af4107a4dfe4a").runReaction(Game.getObjectById("59c292c4af5b7634b9250e60"), Game.getObjectById("59c2aedc88d88930943de023"))
        console.log("Ghodium try: ", ghodium)
    }
    if (Game.time % 10 === 0){
    }

  /* CPU used per tick */
  console.log('====================');
  console.log('CPU stats: ', Game.cpu.limit, Game.cpu.tickLimit, Game.cpu.bucket);
  console.log('CPU used per tick: ');
  console.log(' CREEPS: ', l_cpu.creeps);
  console.log(' SPAWNS: ', l_cpu.spawns);
  console.log(' TOWERS: ', l_cpu.towers);
  console.log(' FLAGS : ', l_cpu.flags);
  console.log('====================');

};
