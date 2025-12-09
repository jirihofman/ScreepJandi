var roleReserver = require('role.reserver'); // reserve only

module.exports = {
  run: function(creep) {
    // Special mode for flag-based claiming
    if (creep.memory.claimFlagMode) {
      // Check if current target is already claimed by us
      if (creep.memory.target && Game.rooms[creep.memory.target]) {
        let controller = Game.rooms[creep.memory.target].controller;
        if (controller && controller.my) {
          // Room is claimed! Find next unclaimed flag
          console.log(creep.name + ' claimed ' + creep.memory.target + ', looking for next flag');
          creep.memory.target = null;
          
          // Find nearest unclaimed flag
          let nearestFlag = this.findNearestUnclaimedFlag(creep.pos);
          if (nearestFlag) {
            creep.memory.target = nearestFlag.pos.roomName;
            console.log(creep.name + ' found next target: ' + creep.memory.target);
            creep.say('→' + nearestFlag.pos.roomName);
          } else {
            console.log(creep.name + ' no more claim flags, task complete');
            creep.say('✓ Done');
            return;
          }
        }
      }
      
      // If no target, find one
      if (!creep.memory.target) {
        let nearestFlag = this.findNearestUnclaimedFlag(creep.pos);
        if (nearestFlag) {
          creep.memory.target = nearestFlag.pos.roomName;
          console.log(creep.name + ' targeting: ' + creep.memory.target);
        } else {
          creep.say('No flags');
          return;
        }
      }
    }
    
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
        roleReserver.run(creep);
        //return;
      } else if (r === OK && creep.memory.claimFlagMode) {
        console.log(creep.name + ' successfully claimed ' + creep.room.name);
        creep.say('✓ Claimed!');
      } else if (r !== OK) {
        console.log('Claimer error: ' + r);
      }

      /* if it is not signed by me, SIGN it */
      if (creep.room.controller){
        let sign = creep.room.controller.sign;
        if (!sign || (sign && sign.username !== creep.owner.username && !sign.text)){
          creep.signController(creep.room.controller, 'Jenjandi ♥ https://github.com/jirihofman/ScreepJandi');
        }
      }
    }
  },
  
  // Helper function to find nearest unclaimed flag
  findNearestUnclaimedFlag: function(pos) {
    if (!Memory.claimFlags) return null;
    
    let nearestFlag = null;
    let nearestDistance = Infinity;
    
    for (let flagName in Memory.claimFlags) {
      let flag = Game.flags[flagName];
      if (!flag) continue;
      
      let roomName = flag.pos.roomName;
      
      // Check if room is already claimed by us
      if (Game.rooms[roomName]) {
        let controller = Game.rooms[roomName].controller;
        if (controller && controller.my) {
          continue; // Skip already claimed rooms
        }
      }
      
      // Calculate distance
      let distance = Game.map.getRoomLinearDistance(pos.roomName, roomName);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestFlag = flag;
      }
    }
    
    return nearestFlag;
  }
};
