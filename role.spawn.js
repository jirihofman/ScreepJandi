module.exports = {
  // a function to run the logic for this role
  run: function(spawn) {
    //spawn.createCustomCreep(energy+energy+20000, 'builderr');
    let creepsInRoom = spawn.room.find(FIND_MY_CREEPS);
    let room = spawn.room;
    if (room.energyAvailable === room.energyCapacityAvailable) {
      spawn.memory.maxedEnergy++;
    }
    // console.log(spawn, ' energy: ', room.energyAvailable, room.energyCapacityAvailable);

    if (Game.time % 750 >= 0 && Game.time % 750 <= 50){
      if (spawn.name === 'Spawn1')
          {name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 8, 'E6N39', 'E5N39', 0);}
    }
    if (Game.time % 750 >= 0 && Game.time % 750 <= 50){
      if (spawn.name === 'Spawn3')
          {name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 8, 'E8N39', 'E8N38', 0);}
    }
    if (Game.time % 1400 >= 0 && Game.time % 1400 <= 50){
      if (spawn.name === 'Spawn2')
          {name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 8, 'E8N36', 'E7N36', 0);}
    }
    if (Game.time % 720 >= 0 && Game.time % 720 <= 100){
      if (spawn.name === 'Spawn4'){
        /* they get renewed a lot */
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E7N33', 'E8N33', 0);
      }
    }
    if (Game.time % 450 >= 0 && Game.time % 450 <= 50){
      if (spawn.name === 'Spawn5')
          {name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 9, 'E9N36', 'E9N37', 0);}
    }
    if (Game.time % 450 >= 0 && Game.time % 450 <= 75){
      if (spawn.name === 'Spawn6')
          {
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E7N33', 'E7N32', 0);
      }
    }
    if (Game.time % 420 >= 0 && Game.time % 420 <= 75){
      if (spawn.name === 'Spawn7')
          {name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 8, 'E8N32', 'E8N31', 0);}
    }

    /* Things to do every 20 ticks
       - search for old roads. If enough, make a repairer (switch upgrader or create new one)
    */
    if (Game.time % 20 === 0){
      /* find structures having ie below 50% of life */
      let l_structures_needing_repair = _.size(room.find(FIND_STRUCTURES, {filter: (s) => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL && s.hits < (s.hitsMax * (spawn.memory._rep_treshold_min || 0.5))}));
      if (l_structures_needing_repair > 0){
        console.log('Structures ', room, ' below ', (spawn.memory._rep_treshold_min || 0.5) * 100, '%: ', l_structures_needing_repair);
        // get a repairer if there is none
        // TODO: Creep must by in the spawn room OMG
        let l_repairer_in_room = _.size(room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role === 'repairer'}));
        console.log('Repairer count: ', l_repairer_in_room);
        if (l_repairer_in_room === 0){
          // no repairer in the room. try 1) change builder/upgrader, 2) spawn one
          let l_upgraders_in_room = _.size(room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role === 'builder'}));
          if (l_upgraders_in_room > 0){
            // 1)
            let l_repairer = room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role === 'builder'})[0];
            l_repairer.memory.role = 'repairer';
            l_repairer.memory._rep_treshold_max = spawn.memory._rep_treshold_min + 0.1; // repair a bit more then spawn treshold
            console.log('Changed an upgrader to repairer. Set _rep_treshold_max: ', l_repairer.memory._rep_treshold_max);
          } else {
            // 2)
            if (spawn.memory.minRepairers === 0){
              spawn.memory.minRepairers = 1;
              if (spawn.memory.minUpgraders > 0){
                spawn.memory.minUpgraders-= 1;
              }
            } else {
              console.log('Repairer min count set to: ', spawn.memory.minRepairers);
              if (spawn.spawning && Game.creeps[spawn.spawning.name].memory.role === 'repairer'){
                console.log('OK, already spawning repairer');
              } else {
                console.log('Should be spawning repairer in few ticks');
              }
            }
          }
        }
      } else {
        if (spawn.memory.minRepairers === 1 && spawn.memory.minBuilders < 8){
          // the tick when the buildings are OK
          spawn.memory.minBuilders++; // we change back the minUpgraders (builder behaves as upgrader when there are no buildings)
          // change role of the repairer to builder
          room.find(FIND_MY_CREEPS, {filter: (s) => s.memory.role === 'repairer'})[0].memory.role = 'builder';
          console.log('changing repairer back to builder');
        }
        spawn.memory.minRepairers = 0; // we dont need repairers
      }
    }

    /* Renew or Recycle */
    spawn.renewCreep(spawn.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: s => s.memory && (s.memory.role === 'longDistanceHarvester' || s.memory.role === 'builder' || s.memory.role === 'miner' || s.memory.role === 'upgrader') && s.ticksToLive > 300 && s.ticksToLive < 1400 && !s.memory.no_renew
    }));

    const l_adjecent_creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
    if(l_adjecent_creeps.length > 0) {
      l_adjecent_creeps.forEach(function(c) {
        if (c.memory.to_recycle === 1){
          spawn.recycleCreep(c);
          console.log('Recycling creep: ' + c);
        }
      });
    }
    if (spawn.name === 'Spawn11'){
      if (Game.time % 350 >= 0 && Game.time % 350 <= 50){
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable, 12, 'E7N44', 'E7N44', 0);
        console.log('Delam LDH pro E7N38 z E7N39');
      }
      console.log('TODO: Preskakuju druhej spawn ', spawn.name);
      return;
    }
    if (spawn.name === 'Spawn22'){
      if (Game.time % 350 >= 0 && Game.time % 350 <= 50){
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable, 12, 'E7N44', 'E6N42', 0);
        console.log('Delam LDH pro E99N67 ');
      }
      console.log('TODO: Preskakuju druhej spawn ', spawn.name);
      return;
    }
    if (spawn.name === 'Spawn33'){
      if (Game.time % 1500 === 0 || Game.time % 1500 === 1 || Game.time % 1500 === 2 || Game.time % 1500 === 3){
            //Game.spawns.Spawn1.createCreep([ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE,ATTACK, MOVE], null, {role: 'attacker', target: 'E96N67'})
      }
      if (Game.time % 900 === 750 || Game.time % 900 === 800 || Game.time % 900 === 752 || Game.time % 900 === 753){
        //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-200, 5, 'E98N69', 'E98N68', 0);
        console.log('Delam LDH pro E98N68 ');
      }
      console.log('TODO: Preskakuju druhej spawn ', spawn.name);
      return;
    }

    if (spawn.name === 'Spawn77'){
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50){
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E8N32', 'E9N32', 0);
        console.log('Delam LDH pro E6N33 ');
      }
      return;
    }
    if (spawn.name === 'Spawn88'){
      if (Game.time % 550 >= 0 && Game.time % 550 <= 50){
          name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E7N31', 'E6N31', 0);
      }
      return;
    }
    if (spawn.name === 'Spawn66'){
      if (Game.time % 500 >= 0 && Game.time % 500 <= 50){
          //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E7N31', 'E6N31', 0);
      }
      if (Game.time % 700 >= 0 && Game.time % 700 <= 50){
        //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E7N31', 'E7N31', 0);
        console.log('Delam LDH pro E7N31 ');
      }
      return;
    }

    if (spawn.name === 'Spawn222'){
      if (Game.time % 1500 >= 0 && Game.time % 1500 <= 50){
        //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E8N32', 'E7N31', 0);
        //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 7, 'E7N35', 'E7N35', 0);
        ////spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
        //spawn.createCreep([ATTACK,ATTACK,TOUGH,ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E6N37'});
      }
      if (Game.time % 550 >= 0 && Game.time % 550 <= 50){
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-300, 15, 'E7N39', 'E7N38', 0);
        console.log('Delam LDH pro E99N67 ');
      }
      return;
    }
    if (spawn.name === 'Spawn333'){
      if (Game.time % 500 >= 0 && Game.time % 500 <= 50){
        //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E8N32', 'E7N31', 0);
        //name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 7, 'E7N35', 'E7N35', 0);
        ////spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      return;
    }
    if (spawn.name === 'Spawn444'){
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50){
        //Game.spawns.Spawn444.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
        ////Game.spawns.Spawn444.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      return;
    }
    if (spawn.name === 'Spawn666'){
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50){
        //Game.spawns.Spawn666.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
        ////Game.spawns.Spawn666.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50){
          //name = Game.spawns.Spawn66.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E7N35', 'E6N34', 0);
      }

      return;
    }

    if (spawn.name === 'Spawn777'){
      if (Game.time % 400 >= 0 && Game.time % 400 <= 50){
      }
      return;
    }
    if (spawn.name === 'Spawn44'){
      if (Game.time % 1500 >= 0 && Game.time % 1500 <= 50){
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E8N36', 'E7N36', 0);
        console.log('Delam LDH pro E7N36 ');
      }
      return;
    }
    if (spawn.name === 'Spawn55'){
      if (Game.time % 1500 >= 0 && Game.time % 1500 <= 50){
        name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-100, 10, 'E8N36', 'E7N36', 0);
        console.log('Delam LDH pro E7N36 ');
      }
      return;
    }
    if (spawn.name === 'Spawn99'){
      if (Game.time % 1500 >= 0 && Game.time % 1500 <= 50){
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
    var numberOfMiners = _.sum(creepsInRoom, (c) => c.memory.role === 'miner' && !Game.getObjectById(c.memory.sourceId).mineralType);
    var numberOfLorries = _.sum(creepsInRoom, (c) => c.memory.role === 'lorry');
        // count the number of long distance harvesters globally
    var numberOfLongDistanceHarvestersE97N66 = _.sum(Game.creeps, (c) =>
            c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E97N66' && c.memory.home === spawn.room.name);
    var numberOfLongDistanceHarvestersE98N66 = _.sum(Game.creeps, (c) =>
            c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E98N66' && c.memory.home === spawn.room.name);
    var numberOfLongDistanceHarvestersE99N65 = _.sum(Game.creeps, (c) =>
            c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E99N65' && c.memory.home === spawn.room.name);
    var numberOfLongDistanceHarvestersE98N65 = _.sum(Game.creeps, (c) =>
            c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E98N65' && c.memory.home === spawn.room.name);
    var numberOfLongDistanceHarvestersE97N68 = _.sum(Game.creeps, (c) =>
            c.memory.role === 'longDistanceHarvester' && c.memory.target === 'E97N68' && c.memory.home === spawn.room.name);

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
          let l_time_needed = (7 * 3 ) + (l_distance.length * 2) + 3; // 3 slight reserve
          // The total spawn time of a creep is the number of body part * 3 ticks
          if (l_miner && l_time_needed >= l_miner.ticksToLive){
            let l_source_needs_miner = !_.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === source.id && c.ticksToLive > l_time_needed);
            // miners for the source with acceptable age (ie. the newly created one)
            if (l_source_needs_miner){
              // or the spawning one
              l_source_needs_miner = !(spawn.spawning && Game.creeps[spawn.spawning.name].memory.sourceId === source.id && Game.creeps[spawn.spawning.name].memory.role === 'miner');
            }

            if (l_source_needs_miner){
              name = spawn.createMiner(source.id);
              console.log('Need ['+spawn.name+'] to replace '+l_miner+' dying miner ['+l_miner.pos.x+','+l_miner.pos.y+']. New miner\'s name is ' + name );
            }
          }
        }
      } // end loop sources

      /* LOOP MIONERAL MINERS */
      // check if all sources have miners

      let minerals = spawn.room.find(FIND_MINERALS);
            // iterate over all sources
      for (let source of minerals) {
        if (source.mineralAmount < 10){
          break; // donw want to build miners where there are almost no minerals
        }
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
            console.log('Creating mineral miner the OLD way');
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
          let l_time_needed = (8 * 3 ) + (l_distance.length * 2) + 5; // 5 slight reserve
          // The total spawn time of a creep is the number of body part * 3 ticks
          if (l_miner && l_time_needed >= l_miner.ticksToLive){
            var l_source_needs_miner = !_.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === source.id && c.ticksToLive > l_time_needed);
            // miners for the source with acceptable age (ie. the newly created one)
            if (l_source_needs_miner){
              // or the spawning one
              l_source_needs_miner = !(spawn.spawning && Game.creeps[spawn.spawning.name].memory.sourceId === source.id && Game.creeps[spawn.spawning.name].memory.role === 'miner');
            }

            if (l_source_needs_miner){
              console.log('Need ['+spawn.name+'] to replace ['+l_miner+'] dying mineral miner ['+l_miner.pos.x+','+l_miner.pos.y+']' );
              name = spawn.createMiner(source.id);
              console.log('New mineral miner\'s name is ' + name);
            }
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
      else if (numberOfLorries < spawn.memory.minLorries) {
        if (energy > 899){
          energy = 900;
          if (spawn.room.controller.level > 6){
            energy = 1300;
          }
        }
        name = spawn.createLorry(energy);
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
      // if not enough upgraders
      else if (numberOfUpgraders < spawn.memory.minUpgraders) {
        name = spawn.createCustomCreep(energy, 'upgrader');
      }
      // if not enough repairers
      else if (numberOfRepairers < spawn.memory.minRepairers) {
        name = spawn.createCustomCreep(energy, 'repairer');
        if (_.isString(name)){ // only if it spawned
          Game.creeps[name].memory._rep_treshold_max = 0.8;
        }
      }
      // if not enough builders
      else if (numberOfBuilders < spawn.memory.minBuilders) {
        name = spawn.createCustomCreep(energy, 'builder');
        console.log('Builder spawning: ', name, spawn.room);
      }
      // if not enough wallRepairers
      else if (numberOfWallRepairers < spawn.memory.minWallRepairers) {
        name = spawn.createCustomCreep(energy, 'wallRepairer');
      }
      // if not enough longDistanceHarvesters for E97N66
      else if (numberOfLongDistanceHarvestersE97N66 < spawn.memory.minLDHE97N66) {
        // try to spawn one
        name = spawn.createLongDistanceHarvester(energy, 4, spawn.room.name, 'E97N66', 0);
      }
      // no longer valid, TODO: automate this section
      else if (numberOfLongDistanceHarvestersE98N66 < spawn.memory.minLDHE98N66) {
        name = spawn.createLongDistanceHarvester(energy, 2, spawn.room.name, 'E98N66', 0);
      }
      else if (numberOfLongDistanceHarvestersE99N65 < spawn.memory.minLDHE99N65) {
        name = spawn.createLongDistanceHarvester(energy, 4, spawn.room.name, 'E99N65', 0);
      }
      else if (numberOfLongDistanceHarvestersE98N65 < spawn.memory.minLDHE98N65) {
        name = spawn.createLongDistanceHarvester(energy, 4, spawn.room.name, 'E98N65', 0);
      }
      else if (numberOfLongDistanceHarvestersE97N68 < spawn.memory.minLDHE97N68) {
        name = spawn.createLongDistanceHarvester(energy, 4, spawn.room.name, 'E97N68', 0);
      }
      else {
        name = -1;
      }
    }

    // print name to console if spawning was a success
    // name > 0 would not work since string > 0 returns false
    if (!(name < 0)) {
      console.log(spawn.name + ' spawned new creep in ', spawn.room, ': ' + name + ' (' + Game.creeps[name].memory.role + ')');
      if (!spawn.memory._spawned){
        spawn.memory._spawned = {};
      }
      if (spawn.memory._spawned[Game.creeps[name].memory.role]){
        spawn.memory._spawned[Game.creeps[name].memory.role]++;
      } else {
        spawn.memory._spawned[Game.creeps[name].memory.role] = 1;
      }
      if (Game.creeps[name].memory.target){
        console.log(' -- target: ', Game.creeps[name].memory.target);
      }
      console.log('Harvesters    : ' + numberOfHarvesters);
      console.log('Upgraders     : ' + numberOfUpgraders);
      console.log('Builders      : ' + numberOfBuilders);
      console.log('Repairers     : ' + numberOfRepairers);
      console.log('WallRepairers : ' + numberOfWallRepairers);
      console.log('Miners        : ' + numberOfMiners);
      console.log('Lorries (450) : ' + numberOfLorries);
      console.log('LDH E97N66    : ' + numberOfLongDistanceHarvestersE97N66);
      console.log('LDH E98N66    : ' + numberOfLongDistanceHarvestersE98N66);
      console.log('LDH E99N65    : ' + numberOfLongDistanceHarvestersE99N65);
      console.log('LDH E97N68    : ' + numberOfLongDistanceHarvestersE97N68);
    } else if (name !== ERR_BUSY && name !== ERR_NOT_ENOUGH_ENERGY && name !== ERR_NOT_OWNER) {
      console.log('Error spawning creep in ', spawn, name);
    }

    /* Set default number of roles for the spawn depending on controller level */
    if (spawn.room.controller.level === 1 && !spawn.memory._pt_lvl){
      console.log('Default number of creeps set for room ', spawn.room);
      spawn.memory.minHarvesters = spawn.memory.minHarvesters || 1;
      spawn.memory.minLorries = spawn.memory.minLorries || 0;
      spawn.memory.minBuilders = spawn.memory.minBuilders || 1;
      spawn.memory.minUpgraders = spawn.memory.minUpgraders || 1;
    } else if (spawn.room.controller.level === 2 && spawn.memory._pt_lvl !== 2) {
      // upgraded form 1 to 2
      console.log('Room upgraded to lvl 2 ', spawn.room);
      spawn.memory.minBuilders = 3; // 3 builders, 1 harvester, 1 upgrader
    } else if (spawn.room.controller.level === 7 && spawn.memory._pt_lvl !== 7) {
      // reduce the number of builders. Thez get much much bigger
      spawn.memory.minBuilders = 1;
    }  else if (spawn.room.controller.level === 8) {
      spawn.memory.minBuilders = 1;  
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
