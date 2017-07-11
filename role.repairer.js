var roleBuilder = require('role.builder');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to repair something
        if (creep.memory.working == true) {
          /* look for brown flags. If any, dismantle buildings on them */
          let l_flags_to_dismantle = creep.pos.findClosestByPath(FIND_FLAGS, {filter: s=>s.color===COLOR_BROWN && s.secondaryColor===COLOR_BROWN});
          if (l_flags_to_dismantle){
            let l_structs_to_dismantle = creep.room.find(FIND_STRUCTURES, {filter: s=>s.pos.x===l_flags_to_dismantle.pos.x && s.pos.y===l_flags_to_dismantle.pos.y})[0];
            if (l_structs_to_dismantle){
              let d = creep.dismantle(l_structs_to_dismantle)
              if (d == ERR_NOT_IN_RANGE) {
                // move towards it
                creep.moveTo(l_structs_to_dismantle);
                creep.say("[D]")
              } else if (d === 0){
                creep.say('🔧x🔧')
              }
            } else {
              l_flags_to_dismantle.remove();
              console.log("Odstranena vlajka");
            }
          } else {
            // find closest structure with less than max hits
            // Exclude walls because they have way too many max hits and would keep
            // our repairers busy forever. We have to find a solution for that later.
            var structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
                // Each repairer can have different treshold, no need to repair full
                // We repair ramparts only to certain extent
                filter: (s) => (s.hits < s.hitsMax*(creep.memory._rep_treshold_max || 0.9) && s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART) || (s.hits < (creep.memory._rep_treshold_max || 0.9) && s.structureType === STRUCTURE_RAMPART && s.hits < 300000)
            });

            // if we find one
            if (structure) {
                // try to repair it, if it is out of range
                let e = creep.carry[RESOURCE_ENERGY];
                let r = creep.repair(structure)
                if (r == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(structure);
                    creep.say("[R]")
                } else if (r === 0){
                    creep.say('🔧🔧')
                }
            }
            // if we can't fine one
            else {
              // look for construction sites
              roleBuilder.run(creep);
            }
          }
        }
            // if creep is supposed to get energy
        else {
          creep.say("[R->E]")
            // find closest container
            let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) &&
                             s.store[RESOURCE_ENERGY] > 0
            });
            // if one was found
            if (container != undefined) {
                // try to withdraw energy, if the container is not in range
                if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(container);
                }
            }
            else {
                // find closest source
                var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                // try to harvest energy, if the source is not in range
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(source);
                }
            }
        }
    }
};
