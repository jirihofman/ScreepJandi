const getMineral = function (room) {
  return room && room.find(FIND_MINERALS)[0];
};

const getState = function (room) {
  const mineral = getMineral(room);
  const regenerating = !!(
    mineral &&
    mineral.mineralAmount < 10 &&
    mineral.ticksToRegeneration > 0
  );

  return {
    mineral: mineral,
    available: !!(mineral && mineral.mineralAmount >= 10),
    regenerating: regenerating,
    pausedUntil: regenerating ? Game.time + mineral.ticksToRegeneration : null
  };
};

const syncMemory = function (room) {
  const state = getState(room);
  if (!room) {
    return state;
  }
  if (!Memory.rooms) Memory.rooms = {};
  if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};

  if (state.regenerating) {
    const existing = Memory.rooms[room.name].mineralRegeneration || {};
    Memory.rooms[room.name].mineralRegeneration = {
      mineralId: state.mineral.id,
      mineralType: state.mineral.mineralType,
      startedAt: existing.startedAt || Game.time,
      pausedUntil: state.pausedUntil
    };
  } else {
    delete Memory.rooms[room.name].mineralRegeneration;
  }

  return state;
};

module.exports = {
  getState: getState,
  isRegenerating: function (room) {
    return getState(room).regenerating;
  },
  syncMemory: syncMemory
};
