var roleReserver = require('role.reserver'); // reserve only

module.exports = {
  run: function(creep) {
    // if in target room
    if (creep.room.name !== creep.memory.target) {
      var exit = creep.room.findExitTo(creep.memory.target); // find exit to target room
      creep.moveTo(creep.pos.findClosestByRange(exit)); // move to exit
    }
    else {
      /* if it is reserverve mode only */
      if (creep.memory.mode === 'c'){
        roleReserver.run(creep);
        creep.say('Claimer->Reserver');
        return;
      }

      let r = creep.claimController(creep.room.controller); // try to claim controller
      if (r === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller); // move towards the controller
      } else if (r === ERR_GCL_NOT_ENOUGH){
        creep.say('NO GCL->reserving');
        let re = creep.reserveController(creep.room.controller);
        if (re !== 0) {
          console.log('Claimer reservation error: ' + re);
          creep.moveTo(creep.room.controller);
        }
      } else if (r !== 0) {
        console.log('Claimer error: ' + r);
      }

      /* if it is not signed by me, SIGN it */
      if (creep.room.controller){
        let sign = creep.room.controller.sign;
        if (!sign || (sign && sign.username !== creep.owner.username && !sign.text)){
          creep.signController(creep.room.controller, 'ScreepJandi on GitHub ♥ https://github.com/jirihofman/ScreepJandi');
        }
      }
    }
  }
};
