// import modules
require('prototype.spawn')();
require('console_info')(); // prototype for Room
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRepairer = require('role.repairer');
var roleWallRepairer = require('role.wallRepairer');
var roleLongDistanceHarvester = require('role.longDistanceHarvester');
var roleClaimer = require('role.claimer');
var roleMiner = require('role.miner');
var roleLorry = require('role.lorry');
var roleAttacker = require('role.attacker');

module.exports.loop = function () {
    // check for memory entries of died creeps by iterating over Memory.creeps
    for (let name in Memory.creeps) {
        // and checking if the creep is still alive
        if (Game.creeps[name] == undefined) {
            // if not, delete the memory entry
            delete Memory.creeps[name];
        }
    }

    // for every creep name in Game.creeps
    for (let name in Game.creeps) {
        // get the creep object
        var creep = Game.creeps[name];

        // if creep is harvester, call harvester script
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        // if creep is upgrader, call upgrader script
        else if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        // if creep is builder, call builder script
        else if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        // if creep is repairer, call repairer script
        else if (creep.memory.role == 'repairer') {
            roleRepairer.run(creep);
        }
        // if creep is wallRepairer, call wallRepairer script
        else if (creep.memory.role == 'wallRepairer') {
            roleWallRepairer.run(creep);
        }
        // if creep is longDistanceHarvester, call longDistanceHarvester script
        else if (creep.memory.role == 'longDistanceHarvester') {
            roleLongDistanceHarvester.run(creep);
        }
        // if creep is claimer, call claimer script
        else if (creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        }
        // if creep is miner, call miner script
        else if (creep.memory.role == 'miner') {
            roleMiner.run(creep);
        }
        // if creep is lorry, call miner lorry
        else if (creep.memory.role == 'lorry') {
            roleLorry.run(creep);
        }
        // if creep is attacker, call attacker script
        else if (creep.memory.role == 'attacker') {
            roleAttacker.run(creep);
        }
    }

    // find all towers
    var towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    // for each tower
    for (let tower of towers) {
        // find closes hostile creep
        var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        // if one is found...
        if (target != undefined) {
            // ...FIRE!
            tower.attack(target);
        }
    }

    // iterate over all the spawns
    for (let spawnName in Game.spawns) {
        /** @type {Spawn} */
        let spawn = Game.spawns[spawnName];
        let creepsInRoom = spawn.room.find(FIND_MY_CREEPS);
        /** @type {Room} */
        let room = spawn.room;
        if (room.energyAvailable === room.energyCapacityAvailable) {
            spawn.memory.maxedEnergy++;
        } else {
            //spawn.memory.maxedEnergy=0; // zatim nenulujeme
        }

        // count the number of creeps alive for each role in this room
        // _.sum will count the number of properties in Game.creeps filtered by the
        //  arrow function, which checks for the creep being a specific role
        var numberOfHarvesters = _.sum(creepsInRoom, (c) => c.memory.role == 'harvester');
        var numberOfUpgraders = _.sum(creepsInRoom, (c) => c.memory.role == 'upgrader');
        var numberOfBuilders = _.sum(creepsInRoom, (c) => c.memory.role == 'builder');
        var numberOfRepairers = _.sum(creepsInRoom, (c) => c.memory.role == 'repairer');
        var numberOfWallRepairers = _.sum(creepsInRoom, (c) => c.memory.role == 'wallRepairer');
        var numberOfMiners = _.sum(creepsInRoom, (c) => c.memory.role == 'miner');
        var numberOfLorries = _.sum(creepsInRoom, (c) => c.memory.role == 'lorry');
        // count the number of long distance harvesters globally
        var numberOfLongDistanceHarvestersE97N66 = _.sum(Game.creeps, (c) =>
            c.memory.role == 'longDistanceHarvester' && c.memory.target == 'E97N66');
        var numberOfLongDistanceHarvestersE98N66 = _.sum(Game.creeps, (c) =>
            c.memory.role == 'longDistanceHarvester' && c.memory.target == 'E98N66');

        var energy = spawn.room.energyCapacityAvailable - (spawn.memory.energy_deflator || 0); 
        var name = undefined;

        // if no harvesters are left AND either no miners or no lorries are left
        //  create a backup creep
        if (numberOfHarvesters == 0 && numberOfLorries == 0) {
            // if there are still miners left
            if (numberOfMiners > 0 ||
                (spawn.room.storage != undefined && spawn.room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
                // create a lorry
                name = spawn.createLorry(150);
            }
            // if there is no miner left
            else {
                // create a harvester because it can work on its own
                name = spawn.createCustomCreep(spawn.room.energyAvailable, 'harvester');
            }
        }
        // if no backup creep is required
        else {
            // check if all sources have miners
            let sources = spawn.room.find(FIND_SOURCES);
            // iterate over all sources
            for (let source of sources) {

                // if the source has no miner
                if (!_.some(creepsInRoom, c => c.memory.role == 'miner' && c.memory.sourceId == source.id)) {
                    // check whether or not the source has a container
                    let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER
                    });
                    // if there is a container next to the source
                    if (containers.length > 0) {
                        // spawn a miner
                        name = spawn.createMiner(source.id);
                        if (name === -6){
                            name = undefined;
                            // nejsou mineraly na minera, udelame harvestera
                        } else {
                            break;
                        }
                    }
                }
            }
        }
        // if none of the above caused a spawn command check for other roles
        if (name == undefined) {

            // if not enough harvesters
            if (numberOfHarvesters < spawn.memory.minHarvesters) {
                // try to spawn one
                name = spawn.createCustomCreep(energy, 'harvester');
            }
            
            // if not enough lorries
            else if (numberOfLorries < spawn.memory.minLorries) {
                // try to spawn one
                if (energy > 899)
                    energy = 900
                name = spawn.createLorry(energy);
            }
            // if there is a claim order defined
            else if (spawn.memory.claimRoom != undefined) {
                // try to spawn a claimer
                name = spawn.createClaimer(spawn.memory.claimRoom);
                // if that worked
                if (!(name < 0)) {
                    // delete the claim order
                    delete spawn.memory.claimRoom;
                }
            }
            // if not enough upgraders
            else if (numberOfUpgraders < spawn.memory.minUpgraders) {
                // try to spawn one
                name = spawn.createCustomCreep(energy, 'upgrader');
            }
            // if not enough repairers
            else if (numberOfRepairers < spawn.memory.minRepairers) {
                // try to spawn one
                name = spawn.createCustomCreep(energy, 'repairer');
            }
            // if not enough builders
            else if (numberOfBuilders < spawn.memory.minBuilders) {
                // try to spawn one
                name = spawn.createCustomCreep(energy, 'builder');
            }
            // if not enough wallRepairers
            else if (numberOfWallRepairers < spawn.memory.minWallRepairers) {
                // try to spawn one
                name = spawn.createCustomCreep(energy, 'wallRepairer');
            }
            // if not enough longDistanceHarvesters for E97N66
            else if (numberOfLongDistanceHarvestersE97N66 < spawn.memory.minLDHE97N66) {
                // try to spawn one
                name = spawn.createLongDistanceHarvester(energy, 2, spawn.room.name, 'E97N66', 0);
            }
            // if not enough longDistanceHarvesters for E98N66
            else if (numberOfLongDistanceHarvestersE98N66 < spawn.memory.minLDHE98N66) {
                // try to spawn one
                name = spawn.createLongDistanceHarvester(energy, 2, spawn.room.name, 'E98N66', 0);
            }
            else {
                // else try renew long sitance harvesters
                name = -1;
                let renewing = spawn.renewCreep(spawn.pos.findClosestByRange(FIND_CREEPS,{
                    filter: s => s.memory.role === 'longDistanceHarvester' || s.memory.role === 'builder'
                }))

                if (renewing === 0)
                  console.log('renewing:' + renewing)
            }
        }

        // print name to console if spawning was a success
        // name > 0 would not work since string > 0 returns false
        if (!(name < 0)) {
            console.log(spawnName + " spawned new creep: " + name + " (" + Game.creeps[name].memory.role + ")");
            console.log("Harvesters    : " + numberOfHarvesters);
            console.log("Upgraders     : " + numberOfUpgraders);
            console.log("Builders      : " + numberOfBuilders);
            console.log("Repairers     : " + numberOfRepairers);
            console.log("WallRepairers : " + numberOfWallRepairers);
            console.log("Miners        : " + numberOfMiners);
            console.log("Lorries (450) : " + numberOfLorries);
            console.log("LDH E97N66    : " + numberOfLongDistanceHarvestersE97N66);
            console.log("LDH E98N66    : " + numberOfLongDistanceHarvestersE98N66);
        }
    }
};
