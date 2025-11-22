module.exports = {
  // a function to run the logic for towers
  run: function (tower) {
    // ensure this tower has memory
    if (!Memory.towers) Memory.towers = {};
    if (!Memory.towers[tower.id]) Memory.towers[tower.id] = {energy_spent: {heal: 0, attack: 0, repair: 0}, events_history: {}};

    /* helper: record event into minute-bucketed history
       - we bucket by minute (Game.time / 60) to limit history size
       - bucketKey is stringified to be a valid Memory key
       - prune older buckets beyond 24h (1440 minutes)
    */
    const recordTowerEvent = function(tid, type){
      const bucket = Math.floor(Game.time / 60);
      if (!Memory.towers[tid].events_history) Memory.towers[tid].events_history = {};
      const key = bucket.toString();
      if (!Memory.towers[tid].events_history[key]) Memory.towers[tid].events_history[key] = {attack:0, heal:0, repair:0};
      Memory.towers[tid].events_history[key][type] += 1;
      // prune older buckets to keep only last 24h (1440 minutes)
      const minKey = (bucket - 1440).toString();
      for (const k in Memory.towers[tid].events_history) {
        if (k < minKey) delete Memory.towers[tid].events_history[k];
      }
    };

    const aggregateTowerEvents = function(tid, minutes){
      const currentBucket = Math.floor(Game.time / 60);
      const minBucket = currentBucket - minutes + 1;
      const out = {attack:0, heal:0, repair:0};
      if (!Memory.towers[tid].events_history) return out;
      for (const k in Memory.towers[tid].events_history) {
        const kb = parseInt(k);
        if (kb >= minBucket && kb <= currentBucket){
          const v = Memory.towers[tid].events_history[k];
          out.attack += v.attack || 0;
          out.heal += v.heal || 0;
          out.repair += v.repair || 0;
        }
      }
      return out;
    };

    // optionally compute and store 1h / 24h aggregates every 20 ticks (cheap)
    if (Game.time % 20 === 0) {
      Memory.towers[tower.id].events_summary = {
        lastHour: aggregateTowerEvents(tower.id, 60),
        lastDay: aggregateTowerEvents(tower.id, 60*24)
      };
    }

    // find closest hostile creep
    // special flag: if a room flag with COLOR_BLUE+COLOR_BLUE exists then towers should only shoot "big" creeps
    // Big = more than 3 body parts -> prevent multiple shoots at 1-body or 2-body creeps
    // The flag is directly on the tower pos
    var l_big_tower_flag = tower.room.find(FIND_FLAGS, {
      filter: (f) => f.color === COLOR_BLUE && f.secondaryColor === COLOR_BLUE && f.pos.isEqualTo(tower.pos)
    })[0];
    var target; 
    if (l_big_tower_flag) { 
      // find closest hostile creep with more than 3 body parts
      target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: (c) => (c.body && c.body.length > 3) });
      Game.spawns['Spawn1'].createCreep([
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
        ATTACK, ATTACK, ATTACK, ATTACK, ATTACK,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
      ], 'Defender3', { role: 'attacker' });
    } else {
      target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    }
    // console.log('Tower checking for hostiles: ', JSON.stringify(target), JSON.stringify(tower));

    // var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    //   filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
    // });

    // if one is found...
    if (target) {
      console.log('Tower ', tower, ' attacking ', target);
      // attack counts as one event on success; energy cost is constant (10) so we only count events
      let _r = tower.attack(target); // ...FIRE!
      if (_r === 0) {
        Memory.towers[tower.id].energy_spent.attack += 1;
        recordTowerEvent(tower.id, 'attack');
      }
      if (tower.energy < 100){
        // safe mode only when it is serious
        tower.room.controller.activateSafeMode();
      }
    } else {
      var target_heal = tower.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c)=>c.hitsMax > c.hits});
      if (target_heal && Game.time % 2 === 0){
        // heal counts as an event; the energy cost per heal is constant so just increment the counter
        let _r = tower.heal(target_heal);
        if (_r === 0) {
          Memory.towers[tower.id].energy_spent.heal += 1;
          recordTowerEvent(tower.id, 'heal');
        }
      } else {
        // containers and ramparts. ramparts up to 220k
        var stru_to_repair = tower.pos.findInRange(FIND_STRUCTURES, 8, {filter: (s) => (s.structureType === STRUCTURE_CONTAINER && s.hits < s.hitsMax*0.7) || (s.structureType === STRUCTURE_RAMPART && s.hits < 150000 && s !== Game.getObjectById('599e838b77b4d7762ccdff1d')) || (s.structureType === STRUCTURE_WALL && s.hits < 150000)} )[0];
        var road_to_repair = tower.pos.findInRange(FIND_STRUCTURES, 8, {filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < 3640} )[0];
        // repair counts as an event; the energy cost per repair is constant so just increment the counter
        let r = tower.repair(stru_to_repair || road_to_repair); // should be two ticks of repair (680)
        if (r === 0) {
          Memory.towers[tower.id].energy_spent.repair += 1;
          recordTowerEvent(tower.id, 'repair');
        }
        if (r !== 0 && r !== -6 && r !== -7){
          console.log('Error tower repairing : ', r);
        }
      }

    }
  }
};
