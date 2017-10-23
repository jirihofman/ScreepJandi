var roomPlannerLabs = require('room.planner.labs');
var roomPlannerLDHs = require('room.planner.ldh');

module.exports = {

  plan: function(r) {
    roomPlannerLDHs.ldhs(r);

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
