/**
 * Hit Squad Member Role
 * 
 * Individual behavior for squad members that coordinate with their team
 */

module.exports = {
  /**
   * Run the logic for a hit squad member
   * @param {Creep} creep - The creep to control
   */
  run: function(creep) {
    // Get squad information
    const squadId = creep.memory.squadId;
    const squad = Memory.squads[squadId];
    
    if (!squad) {
      // Squad no longer exists, recycle
      this.recycleCreep(creep);
      return;
    }
    
    // Execute behavior based on squad status
    switch (squad.status) {
    case 'spawning':
    case 'ready':
      this.waitForSquad(creep, squad);
      break;
    case 'deployed':
      this.combat(creep, squad);
      break;
    case 'retreating':
      this.retreat(creep, squad);
      break;
    default:
      this.waitForSquad(creep, squad);
    }
  },
  
  /**
   * Wait for all squad members to be ready
   * @param {Creep} creep - The creep
   * @param {Object} squad - Squad data
   */
  waitForSquad: function(creep, squad) {
    // Check if all members are ready
    const allReady = squad.members.every((name) => {
      const member = Game.creeps[name];
      return member && !member.spawning;
    });
    
    if (!allReady) {
      // Wait near spawn
      const spawn = Game.spawns[squad.spawnName];
      if (spawn && !creep.pos.inRangeTo(spawn, 3)) {
        creep.moveTo(spawn, {visualizePathStyle: {stroke: '#00ff00'}});
      }
      creep.say('⏳ wait');
      return;
    }
    
    // All ready, move toward target
    if (creep.room.name !== squad.targetRoom) {
      const exit = creep.room.findExitTo(squad.targetRoom);
      creep.moveTo(creep.pos.findClosestByRange(exit), {visualizePathStyle: {stroke: '#ff0000'}});
      creep.say('➡️ move');
      
      // Heal self or nearby squad members while moving
      this.healNearbySquadMembers(creep, squad);
    } else {
      // Arrived at target room - squad manager will update status
      // Just perform combat actions
      this.combat(creep, squad);
    }
  },
  
  /**
   * Combat behavior in target room
   * @param {Creep} creep - The creep
   * @param {Object} squad - Squad data
   */
  combat: function(creep, squad) {
    // Move to target room if not there yet
    if (creep.room.name !== squad.targetRoom) {
      const exit = creep.room.findExitTo(squad.targetRoom);
      creep.moveTo(creep.pos.findClosestByRange(exit), {visualizePathStyle: {stroke: '#ff0000'}});
      this.healNearbySquadMembers(creep, squad);
      return;
    }
    
    // Priority 1: Heal injured squad members
    const injuredMember = this.findInjuredSquadMember(creep, squad);
    if (injuredMember) {
      if (creep.pos.isNearTo(injuredMember)) {
        creep.heal(injuredMember);
      } else {
        creep.rangedHeal(injuredMember);
      }
    }
    
    // Priority 2: Find and attack target
    let target = null;
    
    // If specific target creep, prioritize it
    if (squad.targetCreep) {
      target = Game.creeps[squad.targetCreep];
    }
    
    // Otherwise, find closest hostile creep
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    }
    
    // If no hostile creeps, target hostile structures
    if (!target) {
      target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType !== STRUCTURE_CONTROLLER
      });
    }
    
    // Attack target
    if (target) {
      const attackResult = creep.attack(target);
      const rangedResult = creep.rangedAttack(target);
      
      if (attackResult === ERR_NOT_IN_RANGE && rangedResult === ERR_NOT_IN_RANGE) {
        // Move toward target
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
        creep.say('⚔️ chase');
      } else {
        creep.say('⚔️ fight');
      }
    } else {
      // No targets, hold position and heal
      this.healNearbySquadMembers(creep, squad);
      creep.say('👀 scan');
    }
    
    // Heal self if injured
    if (creep.hits < creep.hitsMax) {
      creep.heal(creep);
    }
  },
  
  /**
   * Retreat to home and recycle
   * @param {Creep} creep - The creep
   * @param {Object} squad - Squad data
   */
  retreat: function(creep, squad) {
    // Find home spawn
    const spawn = Game.spawns[squad.spawnName];
    
    if (!spawn) {
      // Spawn doesn't exist, just die
      return;
    }
    
    // Move to spawn room if not there
    if (creep.room.name !== spawn.room.name) {
      const exit = creep.room.findExitTo(spawn.room.name);
      if (exit) {
        creep.moveTo(creep.pos.findClosestByRange(exit), {visualizePathStyle: {stroke: '#00ff00'}});
      }
      creep.say('↩️ retreat');
      
      // Heal while retreating
      this.healNearbySquadMembers(creep, squad);
      return;
    }
    
    // In spawn room, move to spawn for recycling
    this.recycleCreep(creep);
  },
  
  /**
   * Move to spawn and recycle
   * @param {Creep} creep - The creep
   */
  recycleCreep: function(creep) {
    const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
    
    if (!spawn) {
      return;
    }
    
    if (creep.pos.isNearTo(spawn)) {
      spawn.recycleCreep(creep);
      creep.say('♻️');
    } else {
      creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffff00'}});
      creep.say('↩️ home');
    }
  },
  
  /**
   * Find an injured squad member nearby
   * @param {Creep} creep - The creep
   * @param {Object} squad - Squad data
   * @returns {Creep|null}
   */
  findInjuredSquadMember: function(creep, squad) {
    // Find nearby squad members that are injured
    const nearbyCreeps = creep.room.find(FIND_MY_CREEPS, {
      filter: (c) => {
        return squad.members.includes(c.name) && c.hits < c.hitsMax;
      }
    });
    
    if (nearbyCreeps.length === 0) {
      return null;
    }
    
    // Return the most injured one
    nearbyCreeps.sort((a, b) => {
      const aPercent = a.hits / a.hitsMax;
      const bPercent = b.hits / b.hitsMax;
      return aPercent - bPercent;
    });
    
    return nearbyCreeps[0];
  },
  
  /**
   * Heal nearby squad members or self
   * @param {Creep} creep - The creep
   * @param {Object} squad - Squad data
   */
  healNearbySquadMembers: function(creep, squad) {
    // Check if creep has heal parts
    if (creep.getActiveBodyparts(HEAL) === 0) {
      return;
    }
    
    // Find injured squad member
    const injuredMember = this.findInjuredSquadMember(creep, squad);
    
    if (injuredMember) {
      if (creep.pos.isNearTo(injuredMember)) {
        creep.heal(injuredMember);
      } else if (creep.pos.inRangeTo(injuredMember, 3)) {
        creep.rangedHeal(injuredMember);
      }
      return;
    }
    
    // Heal self if injured
    if (creep.hits < creep.hitsMax) {
      creep.heal(creep);
    }
  }
};
