var roleBuilder = require('role.builder'); // builds things when there are constructionSites

module.exports = {
  // a function to run the logic for this role
  run: function(creep) {
    // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
            // switch state
      creep.memory.working = false;
      creep.memory.maxed = false;
      creep.memory.cycles++;
    }
    // if creep is harvesting energy but is full
    else if (creep.memory.working === false && (creep.carry.energy === creep.carryCapacity || creep.memory.maxed)) {
      // switch state
      creep.memory.working = true;
      creep.memory.steps_from_source = 0; // TODO: can get full from dropped energy too
      creep.memory.ticks_from_source = 0; // TODO: can get full from dropped energy too
      creep.memory.maxed = false;
    }

        // if creep is supposed to transfer energy to a structure
    if (creep.memory.working === true) {
            // if in home room
      if (creep.room.name === creep.memory.home) {
        // find closest spawn, extension or tower which is not full
        var structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    // the second argument for findClosestByPath is an object which takes
                    // a property called filter which can be a function
                    // we use the arrow operator to define it
          filter: (s) => ((s.structureType === STRUCTURE_SPAWN
                                 || s.structureType === STRUCTURE_EXTENSION
                                 || s.structureType === STRUCTURE_STORAGE
                                 || s.structureType === STRUCTURE_TOWER
                                 || s.structureType === STRUCTURE_LINK /* unloading into links as well*/)
                                 && s.energy < s.energyCapacity)
                                 || (s.structureType === STRUCTURE_CONTAINER /* unloading into containers as well*/ && s.store[RESOURCE_ENERGY] < 2000)
        });

        if (!structure) {
          structure = creep.room.storage;
        }

        // if we found one
        if (structure) {
          // try to transfer energy, if it is not in range
          if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            // move towards it
            let m = creep.moveTo(structure, {reusePath:0, visualizePathStyle: {stroke: '#00ffaa'}});
            if (m === 0){
              creep.memory.steps_from_source++; // TODO: can get full from dropped energy too
            }
            creep.memory.ticks_from_source++; // TODO: can get full from dropped energy too
            creep.memory.miving_to_unload++; // cumulative
          }
        }
      }
      // if not in home room...
      else {
        if (creep.room.name === creep.memory.target){
          /* if LDH is in target room and there are roads to be built, build them */
          let l_roads_to_build = creep.room.find(FIND_CONSTRUCTION_SITES)[0];
          if (l_roads_to_build){
            roleBuilder.run(creep);
            creep.say('LDH->B');
            return;
          }
        }
        // find exit to home room
        let exit = creep.room.findExitTo(creep.memory.home);
        // and move to exit
        creep.moveTo(creep.pos.findClosestByPath(exit), {visualizePathStyle: {stroke: '#ff0000'}});
        creep.memory.miving_to_unload++;
      }
    }
    // if creep is supposed to harvest energy from source
    else {
      // if in target room
      if (creep.room.name === creep.memory.target) {
        // find source
        // hledame spadlou energii na zemi
        let energy_dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: s => s.resourceType === RESOURCE_ENERGY && s.amount > 40
        });

        if (energy_dropped) {
          let l_result = creep.pickup(energy_dropped, RESOURCE_ENERGY);
          if (l_result === ERR_NOT_IN_RANGE) {
            // move towards it. reusePath=0 helps unwanted jumping to and fro between rooms
            creep.moveTo(energy_dropped, {reusePath:0, visualizePathStyle: {stroke: '#0000ff'}});
            creep.memory.miving_to_source++;
            if (creep.pos.y === 0){
              // could get stuck when next move was to the left/right and was thrown back to exit
              creep.move(BOTTOM);
            }
            if (creep.pos.y === 49){
              // could get stuck when next move was to the left/right and was thrown back to exit
              creep.move(TOP);
            }
            creep.say('EE');
          } else if (l_result !== 0){
            creep.say('Error LDH ' + l_result);
          } else {
            creep.memory.mining++;
          }
        } else {
          var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE) || creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];

          /* Takes too long to replenish the source, head back and unload */
          if (source && source.energy === 0 && source.ticksToRegeneration > 130){
            console.log('Head back with ', creep.carry.energy, ' energy, it will take ', source.ticksToRegeneration, ' to regenerate');
            creep.memory.maxed = true;
          }

          // try to harvest energy, if the source is not in range
          let h = creep.harvest(source);
          if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
            // move towards source. reusePath=0 helps unwanted jumping to and fro between rooms
            creep.moveTo(source, {reusePath:0, visualizePathStyle: {stroke: '#ff0000'}});
            if (creep.pos.y === 0){
              // could get stuck when next move was to the left/right and was thrown back to exit
              creep.move(BOTTOM);
            }
            if (creep.pos.y === 49){
              // could get stuck when next move was to the left/right and was thrown back to exit
              creep.move(TOP);
            }
            creep.memory.miving_to_source++;
          } else {
            creep.memory.mining++;
          }
        }
      }
      // if not in target room
      else {
        // find exit to target room
        var exit = creep.room.findExitTo(creep.memory.target);
        // move to exit
        creep.moveTo(creep.pos.findClosestByPath(exit), {reusePath:0, visualizePathStyle: {dashed: '#ff0000'}});

        /* TODO hardcoded for room E97N67 */
        if (creep.pos.y >= 46 && creep.pos.x < 23 && creep.memory.home === 'E97N67'){
          creep.moveTo(23, 46, {reusePath:0, visualizePathStyle: {stroke: '#ff0000'}});
          if (creep.pos.y === 46 && creep.pos.x < 23 && creep.memory.home === 'E97N67'){
            creep.move(RIGHT);
          }
          creep.say('lol');
        }

      }
    }

    /* TODO: move to Spawn */
    if (creep.room.name === creep.memory.target) {
      /* Reserve rooms with LDH, https://github.com/jirihofman/ScreepJandi/issues/3 */
      let l_owner = creep.room.controller.owner;
      /* not mine, need to reserve it OR will diminish soon */
      if (l_owner !== creep.owner || creep.room.controller.reservation.ticksToEnd < 1500){
        // spawn a claimer in home room
        // set mode reserve   only
        // check wether there is not a claimer with the same task
        let l_creeps_reserving = _.filter(Game.creeps, c=>c.memory && c.memory.role==='claimer' && c.memory.mode==='c' && c.memory.target===creep.memory.target && c.memory.home===creep.memory.home).length;
        if (l_creeps_reserving===0){
          //Game.spawns.Spawn2.createCreep([CLAIM, CLAIM, MOVE, MOVE], null, { role: 'claimer', target: 'E98N65', home: 'E98N66', mode: 'c' })
          // find spawn
          //console.log('LDH ', creep.name, ' controller in ', creep.room, l_owner, l_owner !== creep.owner, ', creep: ', creep.memory.home, creep.memory.target);
          if ((creep.room.controller.reservation && creep.room.controller.reservation.ticksToEnd < 1500) || !creep.room.controller.reservation){
            let l_ticksToEnd = creep.room.controller.reservation ? creep.room.controller.reservation.ticksToEnd : 'NOT RESERVED';
            let l_spawn = Game.rooms[creep.memory.home].find(FIND_MY_SPAWNS)[0];
            let s = l_spawn.createCreep([CLAIM, CLAIM, CLAIM, MOVE, MOVE, MOVE], null, { role: 'claimer', target: creep.memory.target, home: creep.memory.home, mode: 'c' });
            console.log('Room ', creep.memory.home, ' No claimer-reservator creeps in ', creep.room, '. Progress:', l_ticksToEnd, ' Result: ', s);
            if (s === -6){
              l_spawn.createCreep([CLAIM, CLAIM, MOVE, MOVE], null, { role: 'claimer', target: creep.memory.target, home: creep.memory.home, mode: 'c' });
              console.log(' -- creating slighlty smaller claimer');
            }
          }
        }
      }
    }

    /* if creep lost the working parts, put it down */
    /* TODO: refactor and put it in Creep prototype */
    if (_.sum(creep.body, c => c.type === 'work' && c.hits > 0) === 0){
      creep.memory.to_recycle = 1;
    }
  }
};
