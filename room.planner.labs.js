module.exports = {

  labs: function(r) {
    const l_lvl = r.controller.level
    const l_name = r.name;
    if (l_lvl === 8){
      let l_labs = r.find(FIND_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_LAB})
      let l_labs_pocet = _.size(l_labs);
      //console.log('room.planner.labs.js start', r, l_lvl, l_labs_pocet, l_name);
      if (l_labs_pocet >= 10){
        if (Memory.rooms[l_name].labs.set === 0){
          //console.log('Potrebuju nastavit laboratore');
          this.set_labs(r, l_labs)
        }
      }
    }
  },

  set_labs: function(r, labs){
    //console.log('set_labs start', r, labs);
  }
};
