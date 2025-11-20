/**
 * Comprehensive claim-to-build orchestration module
 * 
 * This module handles the entire process of claiming and building infrastructure
 * in a new room marked with a flag (COLOR_PURPLE + COLOR_PURPLE).
 * 
 * Process:
 * 1. Select source room/spawn to produce creeps
 * 2. Claim the room if not yet claimed
 * 3. Create initial miner (5 WORK, 1-2 MOVE)
 * 4. Upgrade controller to level 2
 * 5. Build extensions
 * 6. Build spawn 2 squares from energy source
 * 7. Create permanent miner (5 WORK, positioned between source and spawn for renewal)
 * 8. When RCL 3: place tower
 * 9. When RCL 4: place storage
 */

var roleClaimer = require('role.claimer');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleMiner = require('role.miner');

module.exports = {
  /**
   * Initialize memory for a claim-to-build operation
   */
  initializeClaimToBuild: function(flag, sourceRoomName) {
    const targetRoomName = flag.pos.roomName;
    
    if (!Memory.claimToBuild) {
      Memory.claimToBuild = {};
    }
    
    if (!Memory.claimToBuild[targetRoomName]) {
      Memory.claimToBuild[targetRoomName] = {
        sourceRoom: sourceRoomName,
        targetRoom: targetRoomName,
        flagPos: {x: flag.pos.x, y: flag.pos.y},
        stage: 'init',
        claimed: false,
        spawnBuilt: false,
        towersPlaced: 0,
        storageBuilt: false
      };
    }
    
    return Memory.claimToBuild[targetRoomName];
  },
  
  /**
   * Find the best source room/spawn to produce creeps for the target room
   */
  findSourceRoom: function(targetRoomName) {
    // Find all my spawns and select the one with highest RCL and energy capacity
    let bestSpawn = null;
    let bestScore = 0;
    
    for (let spawnName in Game.spawns) {
      let spawn = Game.spawns[spawnName];
      let room = spawn.room;
      
      // Calculate distance (simplified - just room name difference)
      let score = room.controller.level * 1000 + room.energyCapacityAvailable;
      
      if (score > bestScore) {
        bestScore = score;
        bestSpawn = spawn;
      }
    }
    
    return bestSpawn ? bestSpawn.room.name : null;
  },
  
  /**
   * Get or create a claimer creep for the target room
   */
  ensureClaimer: function(state) {
    const targetRoom = state.targetRoom;
    const sourceRoom = state.sourceRoom;
    
    // Check if there's already a claimer assigned to this room
    let claimer = _.find(Game.creeps, c => 
      c.memory.role === 'claimer' && 
      c.memory.target === targetRoom
    );
    
    if (!claimer) {
      // Request spawn to create a claimer
      let spawn = Game.rooms[sourceRoom] && Game.rooms[sourceRoom].find(FIND_MY_SPAWNS)[0];
      if (spawn && !spawn.spawning) {
        spawn.memory.claimRoom = targetRoom;
      }
    }
    
    return claimer;
  },
  
  /**
   * Create initial miner with 5 WORK, 1-2 MOVE
   */
  createInitialMiner: function(state) {
    const targetRoom = state.targetRoom;
    const sourceRoom = state.sourceRoom;
    
    // Check if there's already a miner or bootstrap upgrader in target room
    let existingCreep = _.find(Game.creeps, c => 
      (c.memory.role === 'miner' || c.memory.role === 'claimToBuildUpgrader') &&
      c.memory.claimToBuildTarget === targetRoom
    );
    
    if (!existingCreep) {
      let spawn = Game.rooms[sourceRoom] && Game.rooms[sourceRoom].find(FIND_MY_SPAWNS)[0];
      if (spawn && !spawn.spawning) {
        // Create a creep with 5 WORK and 2 MOVE (cost: 600 energy)
        let body = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE];
        let result = spawn.createCreep(body, null, {
          role: 'claimToBuildUpgrader',
          claimToBuildTarget: targetRoom,
          working: false
        });
        
        if (_.isString(result)) {
          console.log('Created initial miner/upgrader for claim-to-build:', result);
          return result;
        }
      }
    }
    
    return existingCreep ? existingCreep.name : null;
  },
  
  /**
   * Create builder for the target room
   */
  createBuilder: function(state) {
    const targetRoom = state.targetRoom;
    const sourceRoom = state.sourceRoom;
    
    let builders = _.filter(Game.creeps, c => 
      c.memory.role === 'claimToBuildBuilder' &&
      c.memory.claimToBuildTarget === targetRoom
    );
    
    // We want 1-2 builders depending on stage
    let targetBuilders = state.stage === 'buildSpawn' ? 2 : 1;
    
    if (builders.length < targetBuilders) {
      let spawn = Game.rooms[sourceRoom] && Game.rooms[sourceRoom].find(FIND_MY_SPAWNS)[0];
      if (spawn && !spawn.spawning) {
        // Create a medium-sized builder
        let body = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        let result = spawn.createCreep(body, null, {
          role: 'claimToBuildBuilder',
          claimToBuildTarget: targetRoom,
          working: false
        });
        
        if (_.isString(result)) {
          console.log('Created builder for claim-to-build:', result);
          return result;
        }
      }
    }
    
    return builders.length > 0 ? builders[0].name : null;
  },
  
  /**
   * Find a good spot for the spawn (2 squares from energy source)
   */
  findSpawnPosition: function(room) {
    let sources = room.find(FIND_SOURCES);
    if (sources.length === 0) return null;
    
    let source = sources[0];
    
    // Find positions 2 squares away from source
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        let x = source.pos.x + dx;
        let y = source.pos.y + dy;
        
        // Check if position is exactly 2 squares away
        let distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (distance !== 2) continue;
        
        // Check if position is valid
        if (x < 2 || x > 47 || y < 2 || y > 47) continue;
        
        let pos = room.getPositionAt(x, y);
        if (!pos) continue;
        
        // Check terrain
        let terrain = room.getTerrain();
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
        
        // Check if there's no structures
        let structures = pos.lookFor(LOOK_STRUCTURES);
        if (structures.length > 0) continue;
        
        // This is a good spot
        return pos;
      }
    }
    
    return null;
  },
  
  /**
   * Build container near energy source
   */
  buildSourceContainer: function(state) {
    const targetRoom = Game.rooms[state.targetRoom];
    if (!targetRoom) return false;
    
    let sources = targetRoom.find(FIND_SOURCES);
    if (sources.length === 0) return false;
    
    let source = sources[0];
    
    // Check if container already exists
    let existingContainer = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    
    if (existingContainer.length > 0) return true;
    
    // Check if construction site exists
    let containerSite = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
    
    if (containerSite.length > 0) return false; // Still building
    
    // Find position adjacent to source
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        let x = source.pos.x + dx;
        let y = source.pos.y + dy;
        
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        
        let pos = targetRoom.getPositionAt(x, y);
        let terrain = targetRoom.getTerrain();
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
        
        let result = targetRoom.createConstructionSite(pos, STRUCTURE_CONTAINER);
        if (result === OK) {
          console.log('Placed container construction site at', pos, 'near source');
          return false; // Not yet built
        }
      }
    }
    
    return false;
  },
  
  /**
   * Create permanent miner for source
   */
  createPermanentMiner: function(state) {
    const targetRoom = Game.rooms[state.targetRoom];
    if (!targetRoom) return false;
    
    let sources = targetRoom.find(FIND_SOURCES);
    if (sources.length === 0) return false;
    
    let source = sources[0];
    
    // Check if container exists near source
    let container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0];
    
    if (!container) return false;
    
    // Check if miner already exists
    let existingMiner = _.find(Game.creeps, c => 
      c.memory.role === 'miner' && 
      c.memory.sourceId === source.id
    );
    
    if (existingMiner) return true;
    
    // Try to spawn miner from local spawn
    let spawn = targetRoom.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning) {
      let result = spawn.createMiner(source.id);
      if (_.isString(result)) {
        console.log('Created permanent miner:', result, 'for', targetRoom.name);
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Build extensions
   */
  buildExtensions: function(state) {
    const targetRoom = Game.rooms[state.targetRoom];
    if (!targetRoom) return false;
    
    // Check how many extensions we have vs how many we can have
    let extensions = targetRoom.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION
    });
    
    let maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][targetRoom.controller.level];
    
    if (extensions.length >= maxExtensions) return true;
    
    // Check for construction sites
    let extensionSites = targetRoom.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION
    });
    
    if (extensionSites.length > 0) return false; // Still building
    
    // Place new extension near spawn
    let spawn = targetRoom.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return false;
    
    for (let distance = 1; distance <= 5; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
          if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;
          
          let x = spawn.pos.x + dx;
          let y = spawn.pos.y + dy;
          
          if (x < 2 || x > 47 || y < 2 || y > 47) continue;
          
          let pos = targetRoom.getPositionAt(x, y);
          let terrain = targetRoom.getTerrain();
          if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
          
          let result = targetRoom.createConstructionSite(pos, STRUCTURE_EXTENSION);
          if (result === OK) {
            console.log('Placed extension construction site at', pos);
            return false; // Not yet complete
          }
        }
      }
    }
    
    return extensions.length >= maxExtensions;
  },
  
  /**
   * Run the claim-to-build logic for a specific operation
   */
  run: function(state) {
    const targetRoomName = state.targetRoom;
    const targetRoom = Game.rooms[targetRoomName];
    
    // Update claimed status
    if (targetRoom && targetRoom.controller && targetRoom.controller.my) {
      state.claimed = true;
    }
    
    // Stage 1: Ensure claimer
    if (!state.claimed) {
      state.stage = 'claiming';
      this.ensureClaimer(state);
      return;
    }
    
    // Stage 2: Create initial upgrader to reach RCL 2
    if (targetRoom && targetRoom.controller.level < 2) {
      state.stage = 'upgradeToRCL2';
      this.createInitialMiner(state);
      this.createBuilder(state); // Also create a builder to help
      return;
    }
    
    // Stage 2.5: Build container for source
    if (targetRoom && !state.containerBuilt) {
      state.stage = 'buildContainer';
      this.createBuilder(state);
      state.containerBuilt = this.buildSourceContainer(state);
      if (!state.containerBuilt) return;
    }
    
    // Stage 3: Build spawn
    if (!state.spawnBuilt && targetRoom && targetRoom.controller.level >= 2) {
      state.stage = 'buildSpawn';
      
      // Check if spawn exists
      let spawns = targetRoom.find(FIND_MY_SPAWNS);
      if (spawns.length > 0) {
        state.spawnBuilt = true;
        console.log('Spawn built in', targetRoomName);
        
        // Build extensions once spawn is ready
        this.buildExtensions(state);
        
        // Create permanent miner
        this.createPermanentMiner(state);
      } else {
        // Create builders
        this.createBuilder(state);
        
        // Place spawn construction site if not already present
        let spawnSites = targetRoom.find(FIND_MY_CONSTRUCTION_SITES, {
          filter: s => s.structureType === STRUCTURE_SPAWN
        });
        
        if (spawnSites.length === 0) {
          let spawnPos = this.findSpawnPosition(targetRoom);
          if (spawnPos) {
            let result = targetRoom.createConstructionSite(spawnPos, STRUCTURE_SPAWN);
            if (result === OK) {
              console.log('Placed spawn construction site at', spawnPos);
            }
          }
        }
      }
      return;
    }
    
    // Stage 4: Place tower when RCL 3
    if (targetRoom && targetRoom.controller.level >= 3 && state.towersPlaced < 1) {
      state.stage = 'placeTower';
      
      let towers = targetRoom.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_TOWER
      });
      
      if (towers.length >= 1) {
        state.towersPlaced = towers.length;
      } else {
        // Find a good position for tower (near spawn)
        let spawn = targetRoom.find(FIND_MY_SPAWNS)[0];
        if (spawn) {
          // Try to place tower near spawn
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              if (dx === 0 && dy === 0) continue;
              
              let x = spawn.pos.x + dx;
              let y = spawn.pos.y + dy;
              
              if (x < 2 || x > 47 || y < 2 || y > 47) continue;
              
              let pos = targetRoom.getPositionAt(x, y);
              let result = targetRoom.createConstructionSite(pos, STRUCTURE_TOWER);
              
              if (result === OK) {
                console.log('Placed tower construction site at', pos);
                return;
              }
            }
          }
        }
      }
    }
    
    // Stage 5: Place storage when RCL 4
    if (targetRoom && targetRoom.controller.level >= 4 && !state.storageBuilt) {
      state.stage = 'placeStorage';
      
      let storages = targetRoom.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_STORAGE
      });
      
      if (storages.length > 0) {
        state.storageBuilt = true;
      } else {
        // Find a good position for storage (near spawn)
        let spawn = targetRoom.find(FIND_MY_SPAWNS)[0];
        if (spawn) {
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              if (dx === 0 && dy === 0) continue;
              
              let x = spawn.pos.x + dx;
              let y = spawn.pos.y + dy;
              
              if (x < 2 || x > 47 || y < 2 || y > 47) continue;
              
              let pos = targetRoom.getPositionAt(x, y);
              let result = targetRoom.createConstructionSite(pos, STRUCTURE_STORAGE);
              
              if (result === OK) {
                console.log('Placed storage construction site at', pos);
                return;
              }
            }
          }
        }
      }
    }
    
    // Stage 6: Complete - maintain operations
    if (state.spawnBuilt && targetRoom && targetRoom.controller.level >= 2) {
      state.stage = 'complete';
      // The local spawn will now handle creep production
    }
  },
  
  /**
   * Run all active claim-to-build operations
   */
  runAll: function() {
    if (!Memory.claimToBuild) return;
    
    for (let targetRoom in Memory.claimToBuild) {
      let state = Memory.claimToBuild[targetRoom];
      
      // Skip completed operations
      if (state.stage === 'complete') {
        // Clean up after some time
        if (Game.rooms[targetRoom] && Game.rooms[targetRoom].controller.level >= 4) {
          // Keep the entry for history but mark as archived
          if (!state.archived) {
            state.archived = true;
            console.log('Claim-to-build operation archived for', targetRoom);
          }
        }
        continue;
      }
      
      this.run(state);
    }
  },
  
  /**
   * Creep behavior for claim-to-build upgrader
   */
  runClaimToBuildUpgrader: function(creep) {
    // This is a special upgrader that also harvests
    const targetRoom = creep.memory.claimToBuildTarget;
    
    // Go to target room if not there
    if (creep.room.name !== targetRoom) {
      let exit = creep.room.findExitTo(targetRoom);
      creep.moveTo(creep.pos.findClosestByRange(exit));
      return;
    }
    
    // Switch between harvesting and upgrading
    if (creep.memory.working && creep.carry.energy === 0) {
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.carry.energy === creep.carryCapacity) {
      creep.memory.working = true;
    }
    
    if (creep.memory.working) {
      // Upgrade controller
      let result = creep.upgradeController(creep.room.controller);
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
    } else {
      // Harvest energy
      let sources = creep.room.find(FIND_SOURCES);
      if (sources.length > 0) {
        let result = creep.harvest(sources[0]);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0]);
        }
      }
    }
  },
  
  /**
   * Creep behavior for claim-to-build builder
   */
  runClaimToBuildBuilder: function(creep) {
    const targetRoom = creep.memory.claimToBuildTarget;
    
    // Go to target room if not there
    if (creep.room.name !== targetRoom) {
      let exit = creep.room.findExitTo(targetRoom);
      creep.moveTo(creep.pos.findClosestByRange(exit));
      return;
    }
    
    // Switch between harvesting and building
    if (creep.memory.working && creep.carry.energy === 0) {
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.carry.energy === creep.carryCapacity) {
      creep.memory.working = true;
    }
    
    if (creep.memory.working) {
      // Build construction sites
      let targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
      if (targets.length > 0) {
        let result = creep.build(targets[0]);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0]);
        }
      } else {
        // No construction sites, upgrade controller instead
        let result = creep.upgradeController(creep.room.controller);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    } else {
      // Harvest energy
      let sources = creep.room.find(FIND_SOURCES);
      if (sources.length > 0) {
        let result = creep.harvest(sources[0]);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0]);
        }
      }
    }
  }
};
