module.exports = function(){
/*
Dobre prikazy
Game.spawns.Spawn1.createLongDistanceHarvester(800, 3, 'E99N66', 'E98N66', 0); --350 carry
Game.rooms.E99N66.ic();Game.rooms.E98N66.ic();Game.rooms.E97N67.ic();
Game.spawns.Spawn1.createCreep([ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE],'a1',{role: 'attacker', target: 'E98N66'})
Game.spawns.Spawn1.createCreep([WORK,WORK,WORK,, MOVE,ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE],'a1',{role: 'attacker', target: 'E98N66'})
Game.creeps.Natalie.signController(Game.getObjectById('58dbc64b8283ff5308a41d65'), "ScreepJandi on GitHub ♥ https://github.com/jirihofman/ScreepJandi")
_.each(Game.rooms.E99N66.find(FIND_MY_CREEPS, {filter: c=>c.memory.role==='lorry'}), l=>{l.drop(RESOURCE_ENERGY); l.memory._task = {id_from: '59604b22fea9e157d3dc187c', id_to:'59600eef4d5e9417dd93dc35', mineral_type:'U'}; l.memory.working=false;})
Game.creeps.Bella.transfer(Game.getObjectById('59668a2706e2ae3bb796faa5'), RESOURCE_CATALYST); delete Game.creeps.Bella.memory._task;
Game.getObjectById('595d44d43d3c7b2a254e0ce6').transferEnergy(Game.getObjectById('595e3495025803287c09413d'))
Game.market.calcTransactionCost(2000, 'W55N98', 'E99N66'); //Game.market.deal('595f21ca23327405bfd8b048', 100, 'E99N66')//595f21ca23327405bfd8b048	0.135	10,000	10,000	W55N98
Game.creeps.Allison.memory._task = {id_from: Game.creeps.Allison.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType===STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 666}).id, mineral_type: RESOURCE_ENERGY}

TODO: https://stackoverflow.com/questions/30324353/screeps-memory-adding-how?rq=1
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
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E97N66' && c.memory.home === room.name);
      var numberOfLongDistanceHarvestersE98N66 = _.sum(Game.creeps, (c) =>
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E98N66' && c.memory.home === room.name);
      var numberOfLongDistanceHarvestersE99N65 = _.sum(Game.creeps, (c) =>
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E99N65' && c.memory.home === room.name);
      var numberOfLongDistanceHarvestersE98N65 = _.sum(Game.creeps, (c) =>
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E98N65' && c.memory.home === room.name);
      var numberOfLongDistanceHarvestersE97N68 = _.sum(Game.creeps, (c) =>
          c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E97N68' && c.memory.home === room.name);

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
      var minLDHE99N65 = Game.spawns[spawn.name].memory.minLDHE99N65 || 0;
      var minLDHE98N65 = Game.spawns[spawn.name].memory.minLDHE98N65 || 0;
      var minLDHE97N68 = Game.spawns[spawn.name].memory.minLDHE97N68 || 0;

      console.log('Harvesters    : ' + numberOfHarvesters, ' out of ', minHarvesters);
      console.log('Upgraders     : ' + numberOfUpgraders, ' out of ', minUpgraders);
      console.log('Builders      : ' + numberOfBuilders, ' out of ', minBuilders);
      console.log('Repairers     : ' + numberOfRepairers, ' out of ', minRepairers);
      console.log('WallRepairers : ' + numberOfWallRepairers, ' out of ', minWallRepairers);
      console.log('Miners        : ' + numberOfMiners, ' out of ', minMiners);
      console.log('Lorries       : ' + numberOfLorries, ' out of ', minLorries);
      console.log('LDH E97N66    : ' + numberOfLongDistanceHarvestersE97N66, ' out of: ', minLDHE97N66);
      console.log('LDH E98N66    : ' + numberOfLongDistanceHarvestersE98N66, ' out of: ', minLDHE98N66);
      console.log('LDH E98N65    : ' + numberOfLongDistanceHarvestersE98N65, ' out of: ', minLDHE98N65);
      console.log('LDH E99N65    : ' + numberOfLongDistanceHarvestersE99N65, ' out of: ', minLDHE99N65);
      console.log('LDH E97N68    : ' + numberOfLongDistanceHarvestersE97N68, ' out of: ', minLDHE97N68);
    };
};
