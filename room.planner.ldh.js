module.exports = {

  ldhs: function(r) {
    const l_name = r.name;
    // find all LDHs harvesting in this room
    // TODO: spawning creep has name? is in memory?
    let l_ldhs = _.filter(Game.creeps, a=>a.memory && a.memory.role === 'longDistanceHarvester' && a.memory.home === l_name);
    let l_ldhs_pocet = _.size(l_ldhs);
    console.log('room.planner.ldhs.js start', r, l_ldhs_pocet, l_name);
    if (Memory.rooms[r.name].ldh){
      // set all numbers to zero
      _.forEach(Memory.rooms[r.name].ldh, (v, k) => {
        Memory.rooms[r.name].ldh[k].n = 0;
        Memory.rooms[r.name].ldh[k].spawning = 0;
      });
    }
    this.set_ldhs(r, l_ldhs);
  },

  /* sets current number of LDharvesters into Memory for each room */
  set_ldhs: function(r, ldhs){
    //console.log('set_labs start', r, labs);
    _.forEach(ldhs, (v) => {
      //console.log('--set_ldhs', r.name, k, v, v.name, v.memory.target);
      if (!Memory.rooms[r.name].ldh){
        Memory.rooms[r.name].ldh = {};
      }
      if (!Memory.rooms[r.name].ldh[v.memory.target]){
        Memory.rooms[r.name].ldh[v.memory.target] = {};
      }
      if (!Memory.rooms[r.name].ldh[v.memory.target].max){
        Memory.rooms[r.name].ldh[v.memory.target].max = 0;
      }
      Memory.rooms[r.name].ldh[v.memory.target].n++;
    });
  }
};
