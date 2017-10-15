module.exports = {
    // a function to run the logic for this role
  run: function(creep) {
        // if in target room
        if (Game.time % 20 !== 0){
            // 19x z 20-ti healuju. Pak ne a muzu zabit na blizko source keepera s poslednim strilecim telem
            //creep.heal(creep);
        }
        
    if (creep.room.name !== creep.memory.target) {
      const exit = creep.room.findExitTo(creep.memory.target);
      if (creep.memory.b){
        creep.heal(creep);
        if (_.filter(creep.body, (p)=>p.type===TOUGH && p.hits > 0).length < 10){
          console.log('Jsem tezce raneny, zustavam v teto mistnosti a healuju se', creep, creep.room);
          creep.moveTo(20,20, {ignoreRoads: true})
          if (creep.pos.x === 0)
              creep.move(RIGHT);
          if (creep.pos.y === 49)
              creep.move(TOP);
          if (creep.pos.y === 0)
              creep.move(BOTTOM);
          creep.say('navnada chill');
          return;
        }
      }
      creep.moveTo(creep.pos.findClosestByRange(exit), {visualizePathStyle: {stroke: '#ff0000'}});
    }
    else {

      /* BAIT part */
      if (creep.memory.b){
        if (_.filter(creep.body, (p)=>p.type===TOUGH && p.hits > 0).length < 20){
          creep.say('navnada zdrha');
          console.log('Jsem tezce raneny, chci pryc z teto mistnosti a healuju se', creep, creep.room);
          let exit = creep.room.findExitTo(creep.memory.home);
          creep.moveTo(creep.pos.findClosestByRange(exit));
          if (creep.pos.x === 1)
              creep.move(LEFT);
        } else {
            l_target = creep.pos.findClosestByRange(FIND_STRUCTURES);// Game.getObjectById('596fc178879b132a4eb95741') //
            creep.moveTo(l_target, {visualizePathStyle: {stroke: '#00ff00'}})
            let ra = creep.rangedAttack(l_target);
            console.log("Attacking:", l_target, ra)
            if (ra !== 0){
                ra = creep.attack(l_target);
            }
            return;
            creep.say(ra);
            
        }
        creep.heal(creep);

        return;
      }

            // find targets: CREEPS, SPAWNS, STRUCUTERS
      let target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);

/*
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_WALL)
            });
*/
      if (!target)
        {target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: s=>s.structureType===STRUCTURE_KEEPER_LAIR && s.ticksToSpawn < 50});}
      if (!target)
        {target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);}
      //if (!target){target = creep.pos.findClosestByRange(FIND_STRUCTURES);}
      if(target) {
        console.log(JSON.stringify(target));
        let l_attack = creep.attack(target);
        creep.rangedAttack(target)
        if(l_attack === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {visualizePathStyle: {stroke: '#0000ff'}});
          creep.heal(creep);
        } else if (l_attack !== 0) {
          console.log('Attacker problem: ' + l_attack);
          creep.heal(creep);
        } else {
          creep.say(l_attack + '- ⚔️⚔️') ;
          
          return;
        }
      } else {
          creep.moveTo(20,20)
          creep.heal(creep);
      }
    }
  }
};
