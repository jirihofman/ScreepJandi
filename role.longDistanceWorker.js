var roleBuilder = require('role.builder');

module.exports = {
  run: function (creep) {
    // If home equals target act like local builder
    if (creep.memory.home === creep.memory.target) {
      roleBuilder.run(creep);
      return;
    }

    // State machine: working=false means "fetch energy from home"; working=true means "work in target room"
    // If out of energy while in target room -> harvest locally instead of going home to refill
    if (creep.memory.working === true && _.sum(creep.carry) === 0) {
      if (creep.room.name !== creep.memory.target) {
        creep.memory.working = false;
        creep.memory.maxed = false;
      } else {
        // keep working==true and allow harvesting in target room
        creep.memory.maxed = false;
      }
    } else if (creep.memory.working === false && (_.sum(creep.carry) === creep.carryCapacity || creep.memory.maxed)) {
      creep.memory.working = true;
      creep.memory.maxed = false;
    }

    // If creep should be working (has energy and is supposed to work)
    if (creep.memory.working) {
      // If in the target room
      if (creep.room.name === creep.memory.target) {
        // First priority: build construction sites
        let cs = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_LAB && s.structureType !== STRUCTURE_TERMINAL });
        if (cs) {
          // use builder behaviour; builder.loc expects creep.memory.target to be the target room
          roleBuilder.run(creep);
          return;
        }

        // If there are no constructions, try to pickup nearby dropped energy / harvest from nearest source
        let energyDrop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 120 });
        if (energyDrop) {
          if (creep.pickup(energyDrop) === ERR_NOT_IN_RANGE) {
            creep.moveTo(energyDrop, { reusePath: 3 });
          }
          return;
        }

        // Try to harvest if there's no construction to do; this makes the worker useful when there is no container
        let s = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (s) {
          if (creep.harvest(s) === ERR_NOT_IN_RANGE) {
            creep.moveTo(s, { reusePath: 5, visualizePathStyle: { stroke: '#ffff00' } });
          }
          return;
        }

        // nothing to do, fallback to builder behaviour (which will upgrade if needed)
        roleBuilder.run(creep);
        return;
      }
      // If not in target room: move towards it
      const exit = creep.room.findExitTo(creep.memory.target);
      creep.moveTo(creep.pos.findClosestByRange(exit), { reusePath: 5, visualizePathStyle: { stroke: '#ff00ff' } });
      return;
    }

    // If creep is supposed to fetch energy from home
    if (creep.room.name === creep.memory.home) {
      // Prefer STORAGE > CONTAINER > TERMINAL
      let st = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => (
          (s.structureType === STRUCTURE_STORAGE && s.store && s.store[RESOURCE_ENERGY] > 0) ||
          (s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 200) ||
          (s.structureType === STRUCTURE_TERMINAL && s.store && s.store[RESOURCE_ENERGY] > 0))
      });

      // pick up dropped energy first (near spawn) if there is any reasonable pile
      if (!st) {
        let dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 200 });
        if (dropped) {
          if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
            creep.moveTo(dropped, { reusePath: 3 });
          }
          return;
        }
      }

      if (st) {
        // withdraw or transfer from tombstones/ruins if close
        if (st.structureType === STRUCTURE_STORAGE || st.structureType === STRUCTURE_TERMINAL || st.structureType === STRUCTURE_CONTAINER) {
          let r = creep.withdraw(st, RESOURCE_ENERGY);
          if (r === ERR_NOT_IN_RANGE) {
            creep.moveTo(st, { reusePath: 3, visualizePathStyle: { stroke: '#00ff00' } });
          } else if (r === ERR_NOT_ENOUGH_RESOURCES) {
            // fallback to harvest if storage doesn't have enough
            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source) {
              if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { reusePath: 3 });
              }
            }
          }
          return;
        }
      }

      // fallback: if no storage found, harvest from nearest source in home
      let src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (src) {
        if (creep.harvest(src) === ERR_NOT_IN_RANGE) {
          creep.moveTo(src, { reusePath: 5 });
        }
      }
      return;
    }
    // If not in home, move to home
    const exitHome = creep.room.findExitTo(creep.memory.home);
    if (exitHome) {
      creep.moveTo(creep.pos.findClosestByRange(exitHome), { reusePath: 5, visualizePathStyle: { stroke: '#00ffff' } });
    }
  }
};
