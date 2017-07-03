module.exports = function() {

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createCustomCreep =
        function(energy, roleName) {
            // create a balanced body as big as possible with the given energy
            //energy-=200 // TODO pryc, udelame je trochu mensi

            var numberOfParts = Math.floor(energy / 200);
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
                body = [WORK, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY]
            }

            // create creep with the created body and the given role
            return this.createCreep(body, undefined, { role: roleName, working: false });
        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createLongDistanceHarvester =
        function (energy, numberOfWorkParts, home, target, sourceIndex) {
            // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part (when no roads)
            var body = [];
            for (let i = 0; i < numberOfWorkParts; i++) {
                body.push(WORK);body.push(MOVE);body.push(CARRY);
            }
            energy -= 400 // when  roads
            // 150 = 100 (cost of WORK) + 50 (cost of MOVE) + 50 (CARRY)
            energy -= 200 * numberOfWorkParts;

            var numberOfParts = Math.floor(energy / 150); //(when no roads)
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);body.push(CARRY);body.push(MOVE);
            }

            // create creep with the created body
            return this.createCreep(body, undefined, {
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
            return this.createCreep([CLAIM, MOVE], undefined, { role: 'claimer', target: target });
        };

    // create a new function for StructureSpawn
    StructureSpawn.prototype.createMiner =
        function (sourceId) {
            return this.createCreep([WORK, WORK, WORK, WORK, WORK, MOVE], undefined,
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
            return this.createCreep(body, undefined, { role: 'lorry', working: false });
        };
};
