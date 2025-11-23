/**
 * Squad Manager - Handles hit squad creation, coordination, and lifecycle
 * 
 * A hit squad is a group of 1-4 coordinated combat creeps that:
 * - Share a common name prefix (e.g., 'fooooo-1', 'fooooo-2')
 * - Wait for all members to spawn before deploying
 * - Move together to a target room/creep
 * - Return and recycle when target is clear or squad is outmatched
 * 
 * Usage Examples:
 * 
 * 1. Create a squad to clear a room:
 *    const squadId = Game.spawns.Spawn1.createHitSquad('W1N1', null, 150);
 * 
 * 2. Create a squad to eliminate a specific creep:
 *    const squadId = Game.spawns.Spawn1.createHitSquad('W1N1', 'EnemyCreep', 120);
 * 
 * 3. Check squad status:
 *    console.log(Memory.squads[squadId].status); // spawning|ready|deployed|retreating
 * 
 * 4. List all active squads:
 *    for (const id in Memory.squads) {
 *      console.log(id, Memory.squads[id].status, Memory.squads[id].members);
 *    }
 */

const SQUAD_ROLE = 'hitSquad';
const MAX_SQUAD_SIZE = 4;
const MIN_BODY_PARTS_PER_CREEP = 10; // Minimum viable combat creep
const MAX_BODY_PARTS_PER_CREEP = 50; // Screeps max per creep
const RETREAT_POWER_THRESHOLD = 1.5; // Retreat if hostile power > squad power * this
const POWER_ATTACK = 30; // Combat power per ATTACK part
const POWER_RANGED_ATTACK = 10; // Combat power per RANGED_ATTACK part
const POWER_HEAL = 12; // Combat power per HEAL part

module.exports = {
  /**
   * Calculate optimal squad composition based on total body parts budget
   * @param {number} totalBodyParts - Total body parts to distribute across squad
   * @param {number} energyPerCreep - Energy available per creep
   * @returns {Object} - { squadSize, bodyPerCreep, bodies }
   */
  calculateSquadComposition: function(totalBodyParts, energyPerCreep) {
    // Determine number of creeps (1-4) based on total body parts
    let squadSize = Math.min(MAX_SQUAD_SIZE, Math.ceil(totalBodyParts / MAX_BODY_PARTS_PER_CREEP));
    squadSize = Math.max(1, squadSize);
    
    // Distribute body parts evenly across creeps
    let bodyPartsPerCreep = Math.floor(totalBodyParts / squadSize);
    
    // Ensure minimum viable creep
    if (bodyPartsPerCreep < MIN_BODY_PARTS_PER_CREEP) {
      squadSize = Math.max(1, Math.floor(totalBodyParts / MIN_BODY_PARTS_PER_CREEP));
      bodyPartsPerCreep = Math.floor(totalBodyParts / squadSize);
    }
    
    // Calculate body composition for each creep
    const bodies = [];
    for (let i = 0; i < squadSize; i++) {
      const body = this.calculateBodyComposition(bodyPartsPerCreep, energyPerCreep);
      if (body.length > 0) {
        bodies.push(body);
      }
    }
    
    return {
      squadSize: bodies.length,
      bodyPartsPerCreep: bodyPartsPerCreep,
      bodies: bodies
    };
  },
  
  /**
   * Calculate balanced body composition for a single squad member
   * Mix of TOUGH, ATTACK, RANGED_ATTACK, HEAL, and MOVE
   * @param {number} targetParts - Target number of body parts
   * @param {number} maxEnergy - Maximum energy available
   * @returns {Array} - Body parts array
   */
  calculateBodyComposition: function(targetParts, maxEnergy) {
    // Body part costs: TOUGH=10, MOVE=50, ATTACK=80, RANGED_ATTACK=150, HEAL=250
    // Strategy: Front-loaded TOUGH, balanced damage/heal, sufficient MOVE
    
    const body = [];
    let partsUsed = 0;
    let energyUsed = 0;
    
    // Cap at max parts per creep
    targetParts = Math.min(MAX_BODY_PARTS_PER_CREEP, targetParts);
    
    // Allocate 15% to TOUGH for damage absorption (front-loaded)
    const toughParts = Math.min(10, Math.floor(targetParts * 0.15));
    for (let i = 0; i < toughParts && partsUsed < targetParts && energyUsed + 10 <= maxEnergy; i++) {
      body.push(TOUGH);
      partsUsed++;
      energyUsed += 10;
    }
    
    // Calculate remaining parts
    let remainingParts = targetParts - partsUsed;
    
    // Allocate remaining parts: 30% ATTACK, 25% RANGED_ATTACK, 20% HEAL, 25% MOVE
    const attackParts = Math.floor(remainingParts * 0.30);
    const rangedParts = Math.floor(remainingParts * 0.25);
    const healParts = Math.floor(remainingParts * 0.20);
    const moveParts = Math.floor(remainingParts * 0.25);
    
    // Add ATTACK parts
    for (let i = 0; i < attackParts && partsUsed < targetParts && energyUsed + 80 <= maxEnergy; i++) {
      body.push(ATTACK);
      partsUsed++;
      energyUsed += 80;
    }
    
    // Add RANGED_ATTACK parts
    for (let i = 0; i < rangedParts && partsUsed < targetParts && energyUsed + 150 <= maxEnergy; i++) {
      body.push(RANGED_ATTACK);
      partsUsed++;
      energyUsed += 150;
    }
    
    // Add HEAL parts
    for (let i = 0; i < healParts && partsUsed < targetParts && energyUsed + 250 <= maxEnergy; i++) {
      body.push(HEAL);
      partsUsed++;
      energyUsed += 250;
    }
    
    // Add MOVE parts (at the end for speed)
    for (let i = 0; i < moveParts && partsUsed < targetParts && energyUsed + 50 <= maxEnergy; i++) {
      body.push(MOVE);
      partsUsed++;
      energyUsed += 50;
    }
    
    // Ensure at least some MOVE parts for mobility (add more if needed and energy allows)
    const currentMoveParts = body.filter((p) => p === MOVE).length;
    const nonMoveParts = body.length - currentMoveParts;
    const neededMoveParts = Math.ceil(nonMoveParts / 2) - currentMoveParts; // Target 1 MOVE per 2 parts
    
    for (let i = 0; i < neededMoveParts && partsUsed < targetParts && energyUsed + 50 <= maxEnergy; i++) {
      body.push(MOVE);
      partsUsed++;
      energyUsed += 50;
    }
    
    return body;
  },
  
  /**
   * Generate a random squad name
   * @returns {string} - Random name (5-8 characters)
   */
  generateSquadName: (function() {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    
    return function() {
      const length = Math.floor(Math.random() * 4) + 5; // 5-8 characters
      let name = '';
      
      for (let i = 0; i < length; i++) {
        if (i % 2 === 0) {
          name += consonants[Math.floor(Math.random() * consonants.length)];
        } else {
          name += vowels[Math.floor(Math.random() * vowels.length)];
        }
      }
      
      return name;
    };
  })(),
  
  /**
   * Initialize a new hit squad
   * @param {string} spawnName - Name of spawn to use
   * @param {string} targetRoom - Target room name
   * @param {string} targetCreep - Optional target creep name
   * @param {number} totalBodyParts - Total body parts budget
   * @returns {string} - Squad ID or error code
   */
  initializeSquad: function(spawnName, targetRoom, targetCreep, totalBodyParts) {
    const spawn = Game.spawns[spawnName];
    if (!spawn) {
      return ERR_NOT_FOUND;
    }
    
    // Initialize Memory.squads if needed
    if (!Memory.squads) {
      Memory.squads = {};
    }
    
    // Generate unique squad name
    const squadName = this.generateSquadName();
    const squadId = squadName + '_' + Game.time;
    
    // Calculate squad composition
    const energyPerCreep = spawn.room.energyCapacityAvailable;
    const composition = this.calculateSquadComposition(totalBodyParts, energyPerCreep);
    
    if (composition.squadSize === 0) {
      console.log('Error: Cannot create squad with given parameters');
      return ERR_INVALID_ARGS;
    }
    
    // Store squad info in memory
    Memory.squads[squadId] = {
      name: squadName,
      spawnName: spawnName,
      targetRoom: targetRoom,
      targetCreep: targetCreep || null,
      status: 'spawning', // spawning, ready, deployed, retreating, recycling
      members: [],
      composition: composition,
      createdTime: Game.time
    };
    
    console.log('Initialized squad', squadId, 'with', composition.squadSize, 'members targeting', targetRoom);
    
    return squadId;
  },
  
  /**
   * Spawn the next member of a squad
   * @param {string} squadId - Squad identifier
   * @returns {number} - OK or error code
   */
  spawnNextMember: function(squadId) {
    const squad = Memory.squads[squadId];
    if (!squad) {
      return ERR_NOT_FOUND;
    }
    
    const spawn = Game.spawns[squad.spawnName];
    if (!spawn || spawn.spawning) {
      return ERR_BUSY;
    }
    
    // Check if all members have been spawned
    const memberIndex = squad.members.length;
    if (memberIndex >= squad.composition.squadSize) {
      return ERR_FULL;
    }
    
    // Get body for this member
    const body = squad.composition.bodies[memberIndex];
    const creepName = squad.name + '-' + (memberIndex + 1);
    
    // Spawn the creep
    const result = spawn.spawnCreep(body, creepName, {
      memory: {
        role: SQUAD_ROLE,
        squadId: squadId,
        squadName: squad.name,
        memberIndex: memberIndex,
        targetRoom: squad.targetRoom,
        targetCreep: squad.targetCreep
      }
    });
    
    if (result === OK) {
      squad.members.push(creepName);
      console.log('Spawning squad member', creepName, 'for squad', squadId);
      
      // Check if squad is complete
      if (squad.members.length === squad.composition.squadSize) {
        console.log('Squad', squadId, 'spawning complete, waiting for all members to be ready');
      }
    }
    
    return result;
  },
  
  /**
   * Check if all squad members are alive and spawned
   * @param {string} squadId - Squad identifier
   * @returns {boolean}
   */
  isSquadReady: function(squadId) {
    const squad = Memory.squads[squadId];
    if (!squad || squad.members.length !== squad.composition.squadSize) {
      return false;
    }
    
    // Check if all members are alive and not spawning
    for (const memberName of squad.members) {
      const creep = Game.creeps[memberName];
      if (!creep || creep.spawning) {
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Update squad status based on current conditions
   * @param {string} squadId - Squad identifier
   */
  updateSquadStatus: function(squadId) {
    const squad = Memory.squads[squadId];
    if (!squad) {
      return;
    }
    
    // Check if squad members are alive
    const aliveMembers = squad.members.filter((name) => Game.creeps[name]);
    
    // If all members dead, clean up squad
    if (aliveMembers.length === 0) {
      console.log('Squad', squadId, 'eliminated - cleaning up memory');
      delete Memory.squads[squadId];
      return;
    }
    
    // Update members list
    squad.members = aliveMembers;
    
    // Check if squad is ready to deploy
    if (squad.status === 'spawning' && this.isSquadReady(squadId)) {
      squad.status = 'ready';
      console.log('Squad', squadId, 'is ready to deploy!');
    }
    
    // Check deployment status
    if (squad.status === 'ready') {
      // Check if any member is in target room
      const inTargetRoom = aliveMembers.some((name) => {
        const creep = Game.creeps[name];
        return creep && creep.room.name === squad.targetRoom;
      });
      
      if (inTargetRoom) {
        squad.status = 'deployed';
        console.log('Squad', squadId, 'has deployed to', squad.targetRoom);
      }
    }
    
    // Check retreat conditions
    if (squad.status === 'deployed' || squad.status === 'ready') {
      const shouldRetreat = this.checkRetreatConditions(squadId);
      if (shouldRetreat) {
        squad.status = 'retreating';
        console.log('Squad', squadId, 'is retreating!');
      }
    }
  },
  
  /**
   * Check if squad should retreat
   * @param {string} squadId - Squad identifier
   * @returns {boolean}
   */
  checkRetreatConditions: function(squadId) {
    const squad = Memory.squads[squadId];
    if (!squad) {
      return false;
    }
    
    // Get all alive squad members
    const members = squad.members.map((name) => Game.creeps[name]).filter((c) => c);
    
    if (members.length === 0) {
      return true;
    }
    
    // Check if target creep is eliminated
    if (squad.targetCreep) {
      const targetCreep = Game.creeps[squad.targetCreep];
      if (!targetCreep) {
        console.log('Target creep', squad.targetCreep, 'eliminated');
        return true;
      }
    }
    
    // Check if target room is clear of hostiles
    const memberInTargetRoom = members.find((m) => m.room.name === squad.targetRoom);
    if (memberInTargetRoom) {
      const hostiles = memberInTargetRoom.room.find(FIND_HOSTILE_CREEPS);
      const hostileStructures = memberInTargetRoom.room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType !== STRUCTURE_CONTROLLER
      });
      
      if (hostiles.length === 0 && hostileStructures.length === 0) {
        console.log('Target room', squad.targetRoom, 'is clear');
        return true;
      }
      
      // Check if outnumbered or outgunned
      const squadPower = this.calculateSquadPower(members);
      const hostilePower = this.calculateHostilePower(memberInTargetRoom.room);
      
      if (hostilePower > squadPower * RETREAT_POWER_THRESHOLD) {
        console.log('Squad', squadId, 'is outgunned (', squadPower, 'vs', hostilePower, ')');
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Calculate combat power of squad members
   * @param {Array} creeps - Array of creep objects
   * @returns {number}
   */
  calculateSquadPower: function(creeps) {
    let power = 0;
    for (const creep of creeps) {
      power += creep.getActiveBodyparts(ATTACK) * POWER_ATTACK;
      power += creep.getActiveBodyparts(RANGED_ATTACK) * POWER_RANGED_ATTACK;
      power += creep.getActiveBodyparts(HEAL) * POWER_HEAL;
    }
    return power;
  },
  
  /**
   * Calculate combat power of hostile creeps
   * @param {Room} room - Room to check
   * @returns {number}
   */
  calculateHostilePower: function(room) {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    let power = 0;
    
    for (const hostile of hostiles) {
      power += hostile.getActiveBodyparts(ATTACK) * POWER_ATTACK;
      power += hostile.getActiveBodyparts(RANGED_ATTACK) * POWER_RANGED_ATTACK;
      power += hostile.getActiveBodyparts(HEAL) * POWER_HEAL;
    }
    
    return power;
  },
  
  /**
   * Run all squad management logic
   * Should be called every tick
   */
  runAll: function() {
    if (!Memory.squads) {
      return;
    }
    
    // Update all squads
    for (const squadId in Memory.squads) {
      const squad = Memory.squads[squadId];
      
      // Update squad status
      this.updateSquadStatus(squadId);
      
      // Try to spawn next member if still spawning
      if (squad && squad.status === 'spawning') {
        this.spawnNextMember(squadId);
      }
    }
  }
};
