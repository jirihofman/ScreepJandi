module.exports = {
  run: function(creep) {
    // If we have a target room and we aren't there yet, move to it first
    if (creep.memory.target && creep.room.name !== creep.memory.target) {
      var exit = creep.room.findExitTo(creep.memory.target);
      creep.moveTo(creep.pos.findClosestByRange(exit), { reusePath: 0 });
      creep.say('Sc->exit');
      return;
    }

    // If a precise position is given, go there and stay.
    // The spawn example uses: { role: 'scout', target: 'W13N55', pos: { x: 25, y: 25 } }
    if (creep.memory.pos && typeof creep.memory.pos.x === 'number' && typeof creep.memory.pos.y === 'number') {
      // build a RoomPosition for the target coordinates. When target room is provided
      // the scout is already in that room due to above check.
      const pos = new RoomPosition(creep.memory.pos.x, creep.memory.pos.y, creep.room.name);

      // If we are at the exact coordinates, do nothing (stay put)
      if (creep.pos.isEqualTo(pos)) {
        // optional: avoid spamming cpu/ticks with moveTo
        creep.say('Hello world!');
        return;
      }

      // Not at wanted pos, move there
      creep.moveTo(pos, { reusePath: 0, visualizePathStyle: { stroke: '#66ffcc' } });
      return;
    }

    // If there is no pos, but a target exists and we're in that room, just idle or walk to center.
    if (creep.memory.target) {
      // Move to the room center so that we are visible
      const center = new RoomPosition(25, 25, creep.room.name);
      if (!creep.pos.isEqualTo(center)) {
        creep.moveTo(center, { reusePath: 0 });
      } else {
        creep.say('Hello world?');
      }
      return;
    }

    // Default behavior: do nothing if no params set
    creep.say('Idle');
  }
};
