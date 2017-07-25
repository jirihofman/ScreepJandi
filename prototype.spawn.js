module.exports = function() {

    // create a new function for StructureSpawn
  StructureSpawn.prototype.createCustomCreep =
        function(energy, roleName, p_memory) {
          // create a balanced body as big as possible with the given energy
          var numberOfParts = Math.floor(energy / 200);
          if (numberOfParts > 16){
            // max body parts: 48
            numberOfParts = 16;
          }
          var body = [];
          for (let i = 0; i < numberOfParts; i++) {
            body.push(WORK);
          }
          for (let i = 0; i < numberOfParts; i++) {
            body.push(CARRY);
          }
          for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
          }

          if (energy <= 599 && energy >= 500){
            body = [WORK, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY];
          }

          if (!p_memory){
            p_memory = { role: roleName, working: false, maxed: false };
          }
          if (p_memory && !p_memory.working){
            p_memory.working = false;
          }
          if (p_memory && !p_memory.maxed){
            p_memory.maxed = false;
          }

          // create creep with the created body and the given role
          return this.createCreep(body, null, p_memory);
        };

    // create a new function for StructureSpawn
  StructureSpawn.prototype.createLongDistanceHarvester =
        function (energy, numberOfWorkParts, home, target, sourceIndex) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part (when no roads)
          var body = [];
          for (let i = 0; i < numberOfWorkParts; i++) {
            body.push(WORK);body.push(MOVE);body.push(CARRY);
          }
            // 150 = 100 (cost of WORK) + 50 (cost of MOVE) + 50 (CARRY)
          energy -= 200 * numberOfWorkParts;

          var numberOfParts = Math.floor(energy / 150); //(when no roads)
          for (let i = 0; i < numberOfParts; i++) {
            if (numberOfWorkParts*3 + i*3 === 48){
              // max body parts: 48
              break;
            }
            body.push(CARRY);body.push(CARRY);body.push(MOVE);
          }

            // create creep with the created body
          return this.createCreep(body, null, {
            role: 'longDistanceHarvester',
            home: home,
            target: target,
            sourceIndex: sourceIndex,
            working: false,
            cycles: 0
          });
        };

    // create a new function for StructureSpawn
  StructureSpawn.prototype.createClaimer =
        function (target) {
          return this.createCreep([CLAIM, MOVE], null, { role: 'claimer', target: target });
        };

    // create a new function for StructureSpawn
  StructureSpawn.prototype.createMiner =
        function (sourceId) {
          /* if the source has also LINK nearby, add one CARRY part and some WORK parts to catch on the transfering part */
          // find the container. If there is, find the adjecent LINK

          // if there is, add the parts
          return this.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, CARRY], null,
                                    { role: 'miner', sourceId: sourceId });
        };

    // create a new function for StructureSpawn
  StructureSpawn.prototype.createLorry =
        function (energy) {
            // create a body with twice as many CARRY as MOVE parts
          var numberOfParts = Math.floor(energy / 150);
          var body = [];
          for (let i = 0; i < numberOfParts * 2; i++) {
            body.push(CARRY);
          }
          for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
          }
            // create creep with the created body and the role 'lorry'
          return this.createCreep(body, null, { role: 'lorry', working: false });
        };
};
