module.exports = function(){
/*
Dobre prikazy
Game.spawns.Spawn1.createLongDistanceHarvester(800, 3, 'E99N66', 'E98N66', 0); --350 carry
Game.rooms.E99N66.ic();Game.rooms.E98N66.ic();
Game.spawns.Spawn1.createCreep([ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE],'a1',{role: 'attacker', target: 'E98N66'})
Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,, MOVE,ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE],'a1',{role: 'attacker', target: 'E98N66'})
Game.creeps.Natalie.signController(Game.getObjectById('58dbc64b8283ff5308a41d65'), "ScreepJandi on GitHub ♥ https://github.com/jirihofman/ScreepJandi")
*/

  Room.prototype.ic =
    function() {
      console.log('ROOM INFO for room: ', this.name);
      let creepsInRoom = this.find(FIND_MY_CREEPS);
      /** @type {Room} */
      let room = this;
      console.log('Energy: ' + room.energyAvailable + ' out of ' + room.energyCapacityAvailable);
      console.log('CREEP INFO for room: ', this.name);

      // count the number of creeps alive for each role in this room
      // _.sum will count the number of properties in Game.creeps filtered by the
      //  arrow function, which checks for the creep being a specific role
      var numberOfHarvesters = _.sum(creepsInRoom, (c) => c.memory.role === 'harvester');
      var numberOfUpgraders = _.sum(creepsInRoom, (c) => c.memory.role === 'upgrader');
      var numberOfBuilders = _.sum(creepsInRoom, (c) => c.memory.role === 'builder');
      var numberOfRepairers = _.sum(creepsInRoom, (c) => c.memory.role === 'repairer');
      var numberOfWallRepairers = _.sum(creepsInRoom, (c) => c.memory.role === 'wallRepairer');
      var numberOfMiners = _.sum(creepsInRoom, (c) => c.memory.role === 'miner');
      var numberOfLorries = _.sum(creepsInRoom, (c) => c.memory.role === 'lorry');
      // count the number of long distance harvesters globally
      var numberOfLongDistanceHarvestersE97N66 = _.sum(Game.creeps, (c) =>
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E97N66');
      var numberOfLongDistanceHarvestersE98N66 = _.sum(Game.creeps, (c) =>
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E98N66');

      var spawn = room.find(FIND_MY_SPAWNS)[0]; // prvni spawn v mistnosti
      var minHarvesters = Game.spawns[spawn.name].memory.minHarvesters;
      var minUpgraders = Game.spawns[spawn.name].memory.minUpgraders;
      var minBuilders = Game.spawns[spawn.name].memory.minBuilders;
      var minRepairers = Game.spawns[spawn.name].memory.minRepairers || 0;
      var minWallRepairers = Game.spawns[spawn.name].memory.minWallRepairers || 0;
      var minMiners = Game.spawns[spawn.name].memory.minMiners || 0;
      var minLorries = Game.spawns[spawn.name].memory.minLorries || 0;
      var minLDHE97N66 = Game.spawns[spawn.name].memory.minLDHE97N66 || 0;
      var minLDHE98N66 = Game.spawns[spawn.name].memory.minLDHE98N66 || 0;

      console.log('Harvesters    : ' + numberOfHarvesters, ' out of ', minHarvesters);
      console.log('Upgraders     : ' + numberOfUpgraders, ' out of ', minUpgraders);
      console.log('Builders      : ' + numberOfBuilders, ' out of ', minBuilders);
      console.log('Repairers     : ' + numberOfRepairers, ' out of ', minRepairers);
      console.log('WallRepairers : ' + numberOfWallRepairers, ' out of ', minWallRepairers);
      console.log('Miners        : ' + numberOfMiners, ' out of ', minMiners);
      console.log('Lorries       : ' + numberOfLorries, ' out of ', minLorries);
      console.log('LDH E97N66    : ' + numberOfLongDistanceHarvestersE97N66, ' out of ', minLDHE97N66);
      console.log('LDH E98N66    : ' + numberOfLongDistanceHarvestersE98N66, ' out of ', minLDHE98N66);

    };
};
