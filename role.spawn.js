module.exports = {
  // a function to run the logic for this role
  run: function(spawn) {
      // if in target room
    let creepsInRoom = spawn.room.find(FIND_MY_CREEPS);
    let room = spawn.room;
    if (room.energyAvailable === room.energyCapacityAvailable) {
      spawn.memory.maxedEnergy++;
    }

    /* Renew or Recycle */
    let renewing = spawn.renewCreep(spawn.pos.findClosestByRange(FIND_CREEPS, {
      filter: s => s.memory && (s.memory.role === 'longDistanceHarvester' || s.memory.role === 'builder')
    }));

    if (renewing === 0)
      {console.log('renewing:' + renewing);}

    const l_adjecent_creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
    if(l_adjecent_creeps.length > 0) {
      //console.log(l_adjecent_creeps.length + " creeps adjecent to " + spawn.name);
      l_adjecent_creeps.forEach(function(c) {
        //console.log(c.name + " is " + c.memory.role + " and has parts: " + c.body.length);
        //console.log(spawn.room.energyCapacityAvailable)//
        if (c.memory.to_recycle === 1){
          spawn.recycleCreep(c);
          console.log('Recycling ' + c);
        }
      });
    }
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

    var energy = spawn.room.energyCapacityAvailable - (spawn.memory.energy_deflator || 0);
    var name = '';

        // if no harvesters are left AND either no miners or no lorries are left
        //  create a backup creep
    if (numberOfHarvesters === 0 && numberOfLorries === 0) {
            // if there are still miners left
      if (numberOfMiners > 0 ||
                (spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
                // create a lorry
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
            name = spawn.createMiner(source.id);
            console.log('Creating miner the OLD way');
            if (name === -6){
              name = null; // nejsou mineraly na minera, udelame harvestera
            } else {
              break;
            }
          }
        } else {
          // if the source has aging moner
          // get the travel distance from miner's position to spawn
          let l_miner = source.pos.findInRange(FIND_MY_CREEPS, 1, {filter: s => s.memory.role === 'miner'})[0];
          let l_distance = [];
          if (l_miner){
            l_distance = spawn.pos.findPathTo(l_miner.pos.x, l_miner.pos.y);
          }
          // time needed to get miner there (BODY_PARTS*3) + (TILES*2) + reserve
          let l_time_needed = (7 * 3 ) + (l_distance.length * 2) + 5; // 5 slight reserve
          // The total spawn time of a creep is the number of body part * 3 ticks
          if (l_miner && l_time_needed >= l_miner.ticksToLive){
            var l_source_needs_miner = !_.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === source.id && c.ticksToLive > l_time_needed);
            // miners for the source with acceptable age (ie. the newly created one)
            if (l_source_needs_miner){
              // or the spawning one
              l_source_needs_miner = !(spawn.spawning && Game.creeps[spawn.spawning.name].memory.sourceId === source.id && Game.creeps[spawn.spawning.name].memory.role === 'miner');
            }

            if (l_source_needs_miner){
              console.log('Need ['+spawn.name+'] to replace ['+l_miner+'] dying miner ['+l_miner.pos.x+','+l_miner.pos.y+']' );
              name = spawn.createMiner(source.id);
              console.log('New miner\'s name is ' + name);
            }
          }
        }
      }
    }
        // if none of the above caused a spawn command check for other roles
    if (!name) {

            // if not enough harvesters
      if (numberOfHarvesters < spawn.memory.minHarvesters) {
                // try to spawn one
        name = spawn.createCustomCreep(energy, 'harvester');
      }

            // if not enough lorries
      else if (numberOfLorries < spawn.memory.minLorries) {
                // try to spawn one
        if (energy > 899)
          {energy = 900;}
        name = spawn.createLorry(energy);
      }
            // if there is a claim order defined
      else if (spawn.memory.claimRoom !== undefined) {
                // try to spawn a claimer
        name = spawn.createClaimer(spawn.memory.claimRoom);
                // if that worked
        if (!(name < 0)) {
                    // delete the claim order
          delete spawn.memory.claimRoom;
        }
      }
            // if not enough upgraders
      else if (numberOfUpgraders < spawn.memory.minUpgraders) {
                // try to spawn one
        name = spawn.createCustomCreep(energy, 'upgrader');
      }
            // if not enough repairers
      else if (numberOfRepairers < spawn.memory.minRepairers) {
                // try to spawn one
        name = spawn.createCustomCreep(energy, 'repairer');
      }
            // if not enough builders
      else if (numberOfBuilders < spawn.memory.minBuilders) {
                // try to spawn one
        name = spawn.createCustomCreep(energy, 'builder');
      }
            // if not enough wallRepairers
      else if (numberOfWallRepairers < spawn.memory.minWallRepairers) {
                // try to spawn one
        name = spawn.createCustomCreep(energy, 'wallRepairer');
      }
            // if not enough longDistanceHarvesters for E97N66
      else if (numberOfLongDistanceHarvestersE97N66 < spawn.memory.minLDHE97N66) {
                // try to spawn one
        name = spawn.createLongDistanceHarvester(energy, 2, spawn.room.name, 'E97N66', 0);
      }
            // if not enough longDistanceHarvesters for E98N66
      else if (numberOfLongDistanceHarvestersE98N66 < spawn.memory.minLDHE98N66) {
                // try to spawn one
        name = spawn.createLongDistanceHarvester(energy, 2, spawn.room.name, 'E98N66', 0);
      }
      else {
        name = -1;
      }
    }

        // print name to console if spawning was a success
        // name > 0 would not work since string > 0 returns false
    if (!(name < 0)) {
      console.log(spawn.name + ' spawned new creep: ' + name + ' (' + Game.creeps[name].memory.role + ')');
      console.log('Harvesters    : ' + numberOfHarvesters);
      console.log('Upgraders     : ' + numberOfUpgraders);
      console.log('Builders      : ' + numberOfBuilders);
      console.log('Repairers     : ' + numberOfRepairers);
      console.log('WallRepairers : ' + numberOfWallRepairers);
      console.log('Miners        : ' + numberOfMiners);
      console.log('Lorries (450) : ' + numberOfLorries);
      console.log('LDH E97N66    : ' + numberOfLongDistanceHarvestersE97N66);
      console.log('LDH E98N66    : ' + numberOfLongDistanceHarvestersE98N66);
    }
  }
};
