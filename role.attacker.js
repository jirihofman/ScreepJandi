module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // if in target room
        if (creep.room.name != creep.memory.target) {
            // find exit to target room
            var exit = creep.room.findExitTo(creep.memory.target);
            // move to exit
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
        else {
            // find targets: CREEPS, SPAWNS, STRUCUTERS
            let target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_WALL)
            });
            if (!target)
                target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
            if (!target)
                target = creep.pos.findClosestByRange(FIND_STRUCTURES);
            if(target) {
                console.log(JSON.stringify(target))
                let l_attack = creep.attack(target)
                if(l_attack == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (l_attack !== 0) {
                    console.log("Attacker problem: " + l_attack)
                } else {
                    creep.say("Huraa")                    
                }
            }
        }
    }
};