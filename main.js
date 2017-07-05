// import modules
require('prototype.spawn')();//dd
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
var roleSpawn = require('role.spawn');

module.exports.loop = function () {
    // check for memory entries of died creeps by iterating over Memory.creeps
  for (let name in Memory.creeps) {
        // and checking if the creep is still alive
    if (!Game.creeps[name]) {
            // if not, delete the memory entry
      delete Memory.creeps[name];
    }
  }

    // for every creep name in Game.creeps
  for (let name in Game.creeps) {
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
  }

    // find all towers
  var towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);
    // for each tower
  for (let tower of towers) {
        // find closes hostile creep
    var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        // if one is found...
    if (target) {
            // ...FIRE!
      tower.attack(target);
    } else {
      var road_to_repair = tower.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < 4900} )[0];
        tower.repair(road_to_repair)
    }
  }

    // iterate over all the spawns
  for (let spawnName in Game.spawns) {
    let spawn = Game.spawns[spawnName];
    roleSpawn.run(spawn);
  }
};
