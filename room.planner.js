var roomPlannerLabs = require('room.planner.labs');
var roomPlannerLDHs = require('room.planner.ldh');

const planEarlyExtensions = function (room) {
  if (!room.controller || !room.controller.my || room.controller.level < 2) {
    return;
  }

  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (!spawn) {
    return;
  }

  const allowed = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level] || 0;
  const existing = room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_EXTENSION
  }).length;
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: s => s.structureType === STRUCTURE_EXTENSION
  }).length;
  let needed = allowed - existing - sites;
  if (needed <= 0) {
    return;
  }

  const terrain = room.getTerrain();
  for (let range = 2; range <= 4 && needed > 0; range++) {
    for (let dx = -range; dx <= range && needed > 0; dx++) {
      for (let dy = -range; dy <= range && needed > 0; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== range) {
          continue;
        }
        const x = spawn.pos.x + dx;
        const y = spawn.pos.y + dy;
        if (x <= 1 || x >= 48 || y <= 1 || y >= 48 || terrain.get(x, y) === TERRAIN_MASK_WALL) {
          continue;
        }
        const pos = new RoomPosition(x, y, room.name);
        if (pos.lookFor(LOOK_SOURCES).length > 0 ||
            pos.lookFor(LOOK_MINERALS).length > 0 ||
            pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART) ||
            pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
          continue;
        }
        if (pos.createConstructionSite(STRUCTURE_EXTENSION) === OK) {
          needed--;
        }
      }
    }
  }
};

module.exports = {

  plan: function(r) {
    roomPlannerLDHs.ldhs(r);
    planEarlyExtensions(r);

    const l_lvl = r.controller.level;
    const l_name = r.name;

    // pokud nemam mistnost v pameti, dam si ji tam
    if (!Memory.rooms){
      Memory.rooms = Memory.rooms || {};
    }
    if (!Memory.rooms[l_name]){
      Memory.rooms[l_name] = {
        labs: {set: 0},
        creep_limit: {
          minUpgraders: 0,
          minBuilders: 1,
          minLorries: 2
        }
      };
    }

    if (l_lvl === 8){
      roomPlannerLabs.labs(r);
      let m = Memory.rooms[l_name];

      /* upgradeSpot, get it from orange/yellow flag */
      let f = r.find(FIND_FLAGS, {filter: (f) => f.color === COLOR_ORANGE && f.secondaryColor === COLOR_YELLOW})[0];
      if (f){
        m.upgradeSpot = f.pos;
        f.remove(); // remove the flag, the position is in memory now
      }

    }
  },

  set_room: function(r){
    //console.log('set_room start', r);
  },

  check_room: function(r){
    // todo kontrola, ze na lvl 8 je upgradeSpot
  }
};
