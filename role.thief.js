var roleLorry = require('role.lorry');

module.exports = {

  run: function(creep) {
    // state switch: if full -> working
    if (creep.memory.working === false && (_.sum(creep.carry) === creep.carryCapacity || creep.memory.maxed)) {
      creep.memory.working = true;
    }

    // when at home behave like a lorry/dump energy
    if (creep.room.name === creep.memory.home) {
//      roleLorry.run(creep);
      creep.say('z->l');
   //   return;
    }

    // improved: move reliably to the target room without zig-zagging
if (creep.room.name !== creep.memory.target) {
  const targetRoom = creep.memory.target;
  // prefer to path to a stable position inside the target room (center)
  const targetPos = new RoomPosition(25, 25, targetRoom);

  

  // Normal cross-room movement: aim for the center of the destination room.
  // ignoreCreeps reduces jitter from moving around other creeps;
  // reusePath keeps the same path for several ticks to avoid recalculating.
  creep.moveTo(targetPos, { reusePath: 20, ignoreCreeps: true, maxRooms: 1, visualizePathStyle: { stroke: '#ffffff' } });
  return;
}

    // ----- we're in the target room -----

    // Safety first: if there are hostile attackers / healers nearby, retreat toward home
    let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
      filter: (h) => h.getActiveBodyparts(ATTACK) > 0 || h.getActiveBodyparts(RANGED_ATTACK) > 0 || h.getActiveBodyparts(HEAL) > 0
    });
    if (hostiles.length > 0) {
      creep.say('⚠ flee');
      let exit = creep.room.findExitTo(creep.memory.home);
      creep.moveTo(creep.pos.findClosestByRange(exit));
      return;
    }

    // Avoid rooms with charged enemy towers (they can one-shot small creeps)
    let enemyTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy > 0
    });
    if (enemyTowers.length > 0) {
      // if we're already full it's worth running home, otherwise retreat to exit
      creep.say('tower!');
      let exit = creep.room.findExitTo(creep.memory.home);
      creep.moveTo(creep.pos.findClosestByRange(exit));
      return;
    }

    // If there are small dropped piles, pick them up (fast wins)
    let dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 40
    });
    if (dropped && _.sum(creep.carry) < creep.carryCapacity) {
      if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
        creep.moveTo(dropped, {reusePath: 5});
      }
      return;
    }

    // Look for sources to steal from, preferring:
    // 1) tombstones/ruins with energy (easy steal)
    // 2) containers with energy
    // 3) storage/terminal with energy
    // 4) spawns/extensions with energy
    // We pick the closest usable target with meaningful amount
    let tomb = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: t => t.store && t.store[RESOURCE_ENERGY] > 0
    });
    if (tomb) {
      let r = creep.withdraw(tomb, RESOURCE_ENERGY);
      if (r === ERR_NOT_IN_RANGE) {
        creep.moveTo(tomb, {reusePath:5});
      }
      return;
    }

    let ruins = creep.pos.findClosestByPath(FIND_RUINS, {
      filter: t => t.store && t.store[RESOURCE_ENERGY] > 0
    });
    if (ruins) {
      let r = creep.withdraw(ruins, RESOURCE_ENERGY);
      if (r === ERR_NOT_IN_RANGE) {
        creep.moveTo(ruins, {reusePath:5});
      }
      return;
    }

    // structures: container/storage/terminal/spawn/extension
    let structTargets = creep.room.find(FIND_STRUCTURES, {
      filter: s => {
        if (s.structureType === STRUCTURE_TOWER) return false; // not a target for withdraw
        if (s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 50) return true;
        if (s.structureType === STRUCTURE_STORAGE && s.store && s.store[RESOURCE_ENERGY] > 200) return true;
        if (s.structureType === STRUCTURE_TERMINAL && s.store && s.store[RESOURCE_ENERGY] > 200) return true;
        if ((s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.energy && s.energy > 0) return true;
        return false;
      }
    });

    // choose best target (by amount) that is reachable
    let l_target = null;
    if (structTargets.length > 0) {
      // try to prefer containers/tombstones first, then storages by amount
      structTargets.sort((a,b) => {
        const aAmt = (a.store ? (a.store[RESOURCE_ENERGY]||0) : (a.energy||0));
        const bAmt = (b.store ? (b.store[RESOURCE_ENERGY]||0) : (b.energy||0));
        return bAmt - aAmt;
      });
      l_target = structTargets[0];
    }

    // if nothing to steal from, head home
    if (!l_target || _.sum(creep.carry) === creep.carryCapacity) {
      let exit = creep.room.findExitTo(creep.memory.home);
      creep.moveTo(creep.pos.findClosestByRange(exit));
      creep.say('jedu domu');
      return;
    }

    // If the chosen target is an owned structure that doesn't support withdraw, or withdraw fails with ERR_INVALID_TARGET,
    // fall back to trying to pick up adjacent dropped resources or try tombstones/ruins again.
    let res = creep.withdraw(l_target, RESOURCE_ENERGY);
    if (res === ERR_NOT_IN_RANGE) {
      creep.moveTo(l_target, {reusePath: 5});
    } else if (res === 0) {
      // success: optionally say or mark working to head home
      creep.say('steal');
    } else if (res === ERR_INVALID_TARGET || res === ERR_NOT_OWNER || res === ERR_NOT_ENOUGH_RESOURCES) {
      // invalid target for withdraw or empty: try pickup in range (someone might drop) or try other targets
      let nearbyDrop = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: r=> r.resourceType===RESOURCE_ENERGY && r.amount>0});
      if (nearbyDrop && _.sum(creep.carry) < creep.carryCapacity) {
        if (creep.pickup(nearbyDrop) === ERR_NOT_IN_RANGE) {
          creep.moveTo(nearbyDrop, {reusePath:5});
        }
        return;
      }

      // try dismantling? (only if creep has WORK parts - we avoid doing this by default)
      // fallback: move to a safe fallback position (center) to avoid being stuck
      creep.moveTo( Math.min(40, Math.max(2, l_target.pos.x)), Math.min(40, Math.max(2, l_target.pos.y)) );
      console.log('Thief withdraw fallback: ' + res, l_target);
    } else {
      // other errors: move slightly off the target to avoid blocking path
      creep.moveTo(l_target, {reusePath:3});
      console.log('Thief error: ' + res, l_target);
    }
  }
};