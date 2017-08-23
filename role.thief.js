var roleLorry = require('role.lorry');
module.exports = {

  run: function(creep) {
    if (creep.memory.working === false && (_.sum(creep.carry) === creep.carryCapacity || creep.memory.maxed)) {
      creep.memory.working = true;
    }

    /* home and full, dump the shit */
    if (creep.room.name === creep.memory.home) {
      roleLorry.run(creep);
      creep.say('z->l');
      return;
    }

    if (creep.room.name !== creep.memory.target) {
      let exit = creep.room.findExitTo(creep.memory.target);
      creep.moveTo(creep.pos.findClosestByRange(exit));
    }
    else {
      // find something to steal from
      // TODO, spawns, extensions, storages, labs, terminals, containers
      const l_target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => (
          (s.structureType === STRUCTURE_SPAWN && s.energy > 120) /* energy increases */
            ||
          (s.structureType === STRUCTURE_EXTENSION && s.energy > 0)
        )
      });

      // if no targetrs for stealing, go home
      // or if lorry is full
      if (!l_target || _.sum(creep.carry)===creep.carryCapacity){
        var exit = creep.room.findExitTo(creep.memory.home);
        creep.moveTo(creep.pos.findClosestByRange(exit));
        creep.say('jedu domu');
        return;
      }


      // Go back if there are charged towers
      // or attack creeps

      let r = creep.withdraw(l_target, RESOURCE_ENERGY);
      if (r === ERR_NOT_IN_RANGE) {
        // move towards the controller
        creep.moveTo(l_target);
        console.log('Thief moving: ' + r, l_target);
      } else if (r !== 0) {
        console.log('Thief error: ' + r, l_target);
        creep.moveTo(36, 18);
      }

    }
  }
};
