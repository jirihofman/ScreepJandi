var roleUpgrader = require('role.upgrader');

module.exports = {
    // a function to run the logic for this role
  run: function (creep) {
        // if target is defined and creep is not in target room
    if (creep.memory.target && creep.room.name !==creep.memory.target) {
            // find exit to target room
      var exit = creep.room.findExitTo(creep.memory.target);
            // move to exit
      creep.moveTo(creep.pos.findClosestByRange(exit), {visualizePathStyle: {stroke: '#ffaa00'}});
      creep.say('B->exit');
            // return the function to not do anything else
      return;
    }

        // if creep is trying to complete a constructionSite but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
            // switch state
      creep.memory.working = false;
      creep.memory.maxed   = false;
    }
    // if creep is harvesting energy but is full
    // TODO: Large creeps might have something like: creep.carry.energy >= creep.carryCapacity*0.9
    else if (creep.memory.working === false && creep.carry.energy >= creep.carryCapacity) {
            // switch state
      creep.memory.working = true;
    }

    if (creep.memory.maxed === true){
            // sam reknu, ze ma jit makat s tim objemem co ma v sobe
      creep.memory.working = true;
    }

        // if creep is supposed to complete a constructionSite
    if (creep.memory.working === true) {

            // find closest constructionSite. Non-roads, non-labs first
      var constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
        filter: s => (s.structureType !== STRUCTURE_ROAD) && (s.structureType !== STRUCTURE_LAB) && (s.structureType !== STRUCTURE_TERMINAL)
      }) || creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            // if one is found
      if (constructionSite) {
                // try to build, if the constructionSite is not in range
        if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
                    // move towards the constructionSite
          creep.moveTo(constructionSite, {visualizePathStyle: {stroke: '#ffaa00'}});
        } else {
          creep.say('Building ...');
        }
      }
            // if no constructionSite is found
      else {
                // go upgrading the controller
        roleUpgrader.run(creep);
          // if next to link or storage, withdraw energy
          l_vedle = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s=>(s.structureType===STRUCTURE_LINK && s.energy > 0) || (s.structureType===STRUCTURE_STORAGE)})[0];
          if (l_vedle) creep.withdraw(l_vedle, RESOURCE_ENERGY)
        creep.say('B->U');
      }
    }
        // if creep is supposed to get energy
    else {
      // find closest container
      let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => (
                  // try extension when emergency
                  creep.memory.ext && s.structureType === STRUCTURE_EXTENSION && s.energy > 0
            ) || _.some(Game.flags, c => c.color === COLOR_YELLOW && c.secondaryColor === COLOR_YELLOW && c.pos.isEqualTo(s.pos) && s.energy >= creep.carryCapacity*0.6)
              || (
                  (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.store[RESOURCE_ENERGY] > 100 /* Nesockuju u minera, ktery to tam sype po 10 */
                )
              
      });

      if (!container) {
        container = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: s => s.structureType === STRUCTURE_EXTENSION && creep.memory.ext && s.energy > 0});
      }

      // if one was found
      if (container) {
        if (container.structureType === STRUCTURE_EXTENSION)
          {creep.say('B<-ext');}
                // try to withdraw energy, if the container is not in range
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(container, {visualizePathStyle: {stroke: '#ff11gg'}});
        }
      }
      else {
                // find closest source
        var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                // try to harvest energy, if the source is not in range
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    // move towards it
          creep.moveTo(source, {visualizePathStyle: {stroke: '#ff00gg'}});
        }
      }
    }
  }
};
