// import modules
require('prototype.spawn')();// extra spawn functions
var roleSpawn = require('role.spawn'); // spawn behaviour
require('console_info')(); // prototype for Room
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRepairer = require('role.repairer');
var roleWallRepairer = require('role.wallRepairer');
var roleLongDistanceHarvester = require('role.longDistanceHarvester');
var roleClaimer = require('role.claimer');
var roleMiner = require('role.miner');
var roleLorry = require('role.lorry');
var roleAttacker = require('role.attacker');

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

    // for every creep name in Game.creeps
  for (let name in Game.creeps) {
    let l_cpu_used = Game.cpu.getUsed();
        // get the creep object
    var creep = Game.creeps[name];

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

    // self recycle
    if (creep.memory.to_recycle === 1){
      let l_spawn = creep.room.find(FIND_MY_SPAWNS)[0];
      if (!l_spawn && creep.memory.home){
        /* cant find spawn in this room, try home */
        l_spawn = creep.room.findExitTo(creep.memory.home);
        console.log('Recycling self, moving to exit');
      }
      let r = creep.moveTo(l_spawn);
      if (r===0){
        creep.say('🚫');
      } else {
        creep.say('Error ' + r);
      }
    }

    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
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
    } else {
      var ramp_to_repair = tower.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 220000} )[0];
      var road_to_repair = tower.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < 3640} )[0];
      let r = tower.repair(road_to_repair || ramp_to_repair); // should be two ticks of repair (680)
      if (r !== 0 && r !== -7){
        console.log('Error repairing road: ' + r);
      }
    }
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    console.log('Tower: ', tower, l_cpu_used);
  }

  // iterate over all the spawns
  for (let spawnName in Game.spawns) {
    let spawn = Game.spawns[spawnName];
    let l_cpu_used = Game.cpu.getUsed();
    roleSpawn.run(spawn);
    l_cpu_used = Game.cpu.getUsed() - l_cpu_used;
    //console.log('Spawn: ', spawnName, l_cpu_used);
  }
};
