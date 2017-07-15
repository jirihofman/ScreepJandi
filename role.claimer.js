module.exports = {
    // a function to run the logic for this role
  run: function(creep) {
    // if in target room
    if (creep.room.name !== creep.memory.target) {
      // find exit to target room
      var exit = creep.room.findExitTo(creep.memory.target);
      // move to exit
      creep.moveTo(creep.pos.findClosestByRange(exit));
    }
    else {
      // try to claim controller
      let r = creep.claimController(creep.room.controller);
      //let r = creep.reserveController(creep.room.controller)
      if (r === ERR_NOT_IN_RANGE) {
        // move towards the controller
        creep.moveTo(creep.room.controller);
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
