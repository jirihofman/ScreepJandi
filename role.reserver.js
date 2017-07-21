module.exports = {

  run: function(creep) {
    if (creep.room.name !== creep.memory.target) {
      var exit = creep.room.findExitTo(creep.memory.target);
      creep.moveTo(creep.pos.findClosestByRange(exit));
    }
    else {
      // try to reserve controller
      let r = creep.reserveController(creep.room.controller);
      if (r === ERR_NOT_IN_RANGE) {
        // move towards the controller
        creep.moveTo(creep.room.controller);
      } else if (r !== 0) {
        console.log('Reserver error: ' + r);
      }

      /* if it is not signed by me, SIGN it */
      if (creep.room.controller){
        let sign = creep.room.controller.sign;
        if (!sign || (sign && sign.username !== creep.owner.username && !sign.text)){
          creep.signController(creep.room.controller, 'Jenjandi\'s, keep out!');
        }
      }
    }
  }
};
