module.exports = {
  // a function to run the logic for this role
  run: function(spawn) {
    // Ensure Memory.rooms and Memory.rooms[room.name] are initialized
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[spawn.room.name]) Memory.rooms[spawn.room.name] = {};
  if (!Memory.rooms[spawn.room.name].creep_limit) Memory.rooms[spawn.room.name].creep_limit = {};
    //spawn.createCustomCreep(energy+energy+20000, 'builderr');
    let creepsInRoom = spawn.room.find(FIND_MY_CREEPS);
    let room = spawn.room;

    /* LDH. Data from Memory.rooms.ROOM.ldh */
    if (Memory && Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].ldh) {
      _.forEach(Memory.rooms[room.name].ldh, (v, k) => {
        //console.log('/////',room.name,  k);
        let l_room = k;
        let l_ldh = Memory.rooms[spawn.room.name].ldh[l_room];
        if (!l_ldh){
          l_ldh = { spawning: 0, n: 0, max: 0, work_parts: 10 };
        }
        //console.log('-----', spawn.name, 'spawning: ', l_ldh.spawning, 'n: ', l_ldh.n, 'max:', l_ldh.max);
        if ( l_ldh.max > (l_ldh.spawning+l_ldh.n) ){
          // want to create harvester
          //console.log(' ++++ need ', l_ldh.max - (l_ldh.spawning+l_ldh.n), ' harvesters');
          name = spawn.createLongDistanceHarvester(spawn.room.energyCapacityAvailable-200, l_ldh.work_parts || 10, l_ldh.home || spawn.room.name, l_room, 0);
          // raise the counter of spawning creeps if creeps is started
          // it is set properly later in room.planner.ldh.set_ldhs
          if (_.isString(name)){ // only if it spawned
            Memory.rooms[spawn.room.name].ldh[l_room].spawning++;
            return;
          }
        }
      });
    }

    if (room.energyAvailable === room.energyCapacityAvailable) {
      spawn.memory.maxedEnergy++;
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
      filter: s => s.memory && (s.memory.role === 'longDistanceHarvester' || s.memory.role === 'builder' || s.memory.role === 'miner' || s.memory.role === 'harvester' || s.memory.role === 'upgrader') && s.ticksToLive > 300 && s.ticksToLive < 1400 && !s.memory.no_renew
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


    // TODO predelat do memory ldh
    if (spawn.name === 'Spawn11'){
      return;
    }
    if (spawn.name === 'Spawn111'){
      return;
    }
    if (spawn.name === 'Spawn22'){
      return;
    }
    if (spawn.name === 'Spawn222'){
      if (Game.time % 1500 >= 0 && Game.time % 1500 <= 50){
        ////spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
        //spawn.createCreep([ATTACK,ATTACK,TOUGH,ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK],null,{role: 'attacker', target: 'E6N37'});
      }
      return;
    }
    if (spawn.name === 'Spawn33'){
      return;
    }
    if (spawn.name === 'Spawn333'){
      return;
    }
    if (spawn.name === 'Spawn44'){
      return;
    }
    if (spawn.name === 'Spawn444'){
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50){
        //Game.spawns.Spawn444.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
        ////Game.spawns.Spawn444.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      return;
    }
    if (spawn.name === 'Spawn55'){
      return;
    }
    if (spawn.name === 'Spawn555'){
      return;
    }
    if (spawn.name === 'Spawn66'){
      return;
    }
    if (spawn.name === 'Spawn666'){
      if (Game.time % 300 >= 0 && Game.time % 300 <= 50){
        //Game.spawns.Spawn666.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
        ////Game.spawns.Spawn666.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,ATTACK,HEAL,HEAL,HEAL],null,{role: 'attacker', target: 'E8N35', b: true});
      }
      return;
    }
    if (spawn.name === 'Spawn77'){
      return;
    }
    if (spawn.name === 'Spawn777'){
      return;
    }
    if (spawn.name === 'Spawn88'){
      return;
    }
    if (spawn.name === 'Spawn888'){
      return;
    }
    if (spawn.name === 'Spawn99'){
      if (Game.time % 2600 >= 0 && Game.time % 2600 <= 50){
        //spawn.createLongDistanceHarvester(5000, 10, 'E2N29', 'E2N29', 0);
        //spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK],null,{role: 'attacker', target: 'E2N29', b: false});
      }
      return;
    }
    if (spawn.name === 'Spawn999'){
      if (Game.time % 2600 >= 0 && Game.time % 2600 <= 50){
        //spawn.createLongDistanceHarvester(5000, 10, 'E2N29', 'E2N29', 0);
        //spawn.createCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK],null,{role: 'attacker', target: 'E2N29', b: false});
      }
      return;
    }
    if (spawn.name === 'Spawn101'){
      return;
    }
    if (spawn.name === 'Spawn131'){
      return;
    }
    if (spawn.name === 'Spawn1011'){
      return;
    }
    if (spawn.name === 'Spawn112'){
      return; // 11-2
    }


    // count the number of creeps alive for each role in this room
    // _.sum will count the number of properties in Game.creeps filtered by the
    //  arrow function, which checks for the creep being a specific role
    var numberOfHarvesters = _.sum(creepsInRoom, (c) => c.memory.role === 'harvester');
    var numberOfUpgraders = _.sum(creepsInRoom, (c) => c.memory.role === 'upgrader');
    var numberOfBuilders = _.sum(creepsInRoom, (c) => c.memory.role === 'builder');
    var numberOfRepairers = _.sum(creepsInRoom, (c) => c.memory.role === 'repairer');
    var numberOfWallRepairers = _.sum(creepsInRoom, (c) => c.memory.role === 'wallRepairer');
    var numberOfMiners = 1;//_.sum(creepsInRoom, (c) => c.memory.role === 'miner' && !Game.getObjectById(c.memory.sourceId).mineralType);
    var numberOfLorries = _.sum(creepsInRoom, (c) => c.memory.role === 'lorry');

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
            // TODO: revisit. Causes problems in W13N45 - builds miner even though there is a harvester there
                 // name = spawn.createMiner(source.id);
                 console.log('NOT Creating miner the OLD way');
                 break;
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
  else if (numberOfLorries < (Memory.rooms[spawn.room.name].creep_limit.minLorries || 0)) {
        if (energy > 899){
          energy = 900;
          if (spawn.room.controller.level > 5){
            energy = 1300;
          }
          if (spawn.room.controller.level === 8){
            energy = 1600; //floor 1600/150=10
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
      else if ( Memory.rooms[spawn.room.name] && Memory.rooms[spawn.room.name].creep_limit && Memory.rooms[spawn.room.name].creep_limit.minUpgraders && numberOfUpgraders < Memory.rooms[spawn.room.name].creep_limit.minUpgraders) {
        name = spawn.createCustomCreep(energy, 'upgrader');
      }
      // if not enough repairers
      else if (numberOfRepairers < spawn.memory.minRepairers) {
        if (energy > 899)
        {energy = 900;} // we dont need huge repairers
        name = spawn.createCustomCreep(energy, 'repairer');
        if (_.isString(name)){ // only if it spawned
          Game.creeps[name].memory._rep_treshold_max = 0.8;
        }
      }
      // if not enough builders
      else if (numberOfBuilders < spawn.memory.minBuilders || (Memory.rooms[spawn.room.name] && Memory.rooms[spawn.room.name].creep_limit && Memory.rooms[spawn.room.name].creep_limit.minBuilders && numberOfBuilders < Memory.rooms[spawn.room.name].creep_limit.minBuilders)) {
        name = spawn.createCustomCreep(energy, 'builder');
        console.log('Builder spawning: ', name, spawn.room);
      }
      // if not enough wallRepairers
      else if (numberOfWallRepairers < spawn.memory.minWallRepairers) {
        name = spawn.createCustomCreep(energy, 'wallRepairer');
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
    } else if (name !== ERR_BUSY && name !== ERR_NOT_ENOUGH_ENERGY && name !== ERR_NOT_OWNER) {
      console.log('Error spawning creep in ', spawn, name);
    }

    /* Set default number of roles for the spawn depending on controller level */
    if (spawn.room.controller.level === 1 && !spawn.memory._pt_lvl){
      console.log('Default number of creeps set for room ', spawn.room);
      spawn.memory.minHarvesters = spawn.memory.minHarvesters || 1;
      Memory.rooms[spawn.room.name].creep_limit.minLorries = Memory.rooms[spawn.room.name].creep_limit.minLorries || 0;
      spawn.memory.minBuilders = spawn.memory.minBuilders || 1;
      spawn.memory.minUpgraders = spawn.memory.minUpgraders || 1;
    } else if (spawn.room.controller.level === 2 && spawn.memory._pt_lvl !== 2) {
      // upgraded form 1 to 2
      console.log('Room upgraded to lvl 2 ', spawn.room);
      spawn.memory.minBuilders = 3; // 3 builders, 1 harvester, 1 upgrader
    } else if (spawn.room.controller.level === 7 && spawn.memory._pt_lvl !== 7) {
      // reduce the number of builders. Thez get much much bigger
      spawn.memory.minBuilders = 1;
    }  else if (spawn.room.controller.level === 8 && spawn.memory._pt_lvl === 7) {
      Memory.rooms[spawn.room.name].creep_limit.minBuilders = 0;
      Memory.rooms[spawn.room.name].creep_limit.minUpgraders = 1;
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
