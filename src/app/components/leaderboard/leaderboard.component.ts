import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { Player } from '../../models/player.model';
import { GameState } from '../../models/game-state.model';

/**
 * Interface representing a leaderboard entry with calculated rank
 */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  currentPosition: number;
  isFinished: boolean;
  finishTime?: Date;
  isMoving: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  @ViewChild('leaderboardContainer') leaderboardContainer?: ElementRef<HTMLDivElement>;
  @Output() targetSelected = new EventEmitter<string>();

  leaderboardEntries: LeaderboardEntry[] = [];
  movingPlayerId: string | null = null;
  selectedTargetId: string | null = null;
  currentDiceRollerId: string | null = null;
  hasRolledDice = false;
  searchQuery = '';
  winningPositions: number[] = [16]; // Default includes 16 (Requirements 13.5)
  private stateSubscription?: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    // Subscribe to game state changes
    this.stateSubscription = this.gameService.state$.subscribe(state => {
      if (state) {
        this.updateFromState(state);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Update leaderboard from game state
   */
  private updateFromState(state: GameState): void {
    // Get the currently moving player (selected target)
    this.movingPlayerId = state.selectedTargetId;
    this.selectedTargetId = state.selectedTargetId;
    this.currentDiceRollerId = state.currentDiceRollerId;
    this.hasRolledDice = state.lastDiceResult !== null;
    
    // Update winning positions from game state (Requirements 13.5)
    this.winningPositions = state.winningPositions || [16];

    // Auto-select current dice roller as default target if no target selected
    if (!this.selectedTargetId && this.currentDiceRollerId) {
      const currentRoller = state.players.find(p => p.id === this.currentDiceRollerId);
      if (currentRoller && !currentRoller.isFinished) {
        this.selectTarget(this.currentDiceRollerId);
      }
    }

    // Calculate leaderboard entries with ranks
    this.leaderboardEntries = this.calculateLeaderboard(state.players);
  }

  /**
   * Calculate leaderboard entries sorted by position
   * Finished players are at the top, sorted by finish time
   * Active players are sorted by position (descending)
   */
  private calculateLeaderboard(players: Player[]): LeaderboardEntry[] {
    // Map players to leaderboard entries
    const entries: LeaderboardEntry[] = players.map(player => ({
      rank: 0, // Will be calculated after sorting
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      currentPosition: player.position,
      isFinished: player.isFinished,
      finishTime: player.finishTime,
      isMoving: player.id === this.movingPlayerId,
      isSelected: player.id === this.selectedTargetId
    }));

    // Sort entries:
    // 1. Finished players first (sorted by finish time - earliest first)
    // 2. Then by position (descending)
    entries.sort((a, b) => {
      // Both finished - sort by finish time
      if (a.isFinished && b.isFinished) {
        const timeA = a.finishTime ? new Date(a.finishTime).getTime() : 0;
        const timeB = b.finishTime ? new Date(b.finishTime).getTime() : 0;
        return timeA - timeB; // Earlier finish time = higher rank
      }
      
      // Only a is finished - a comes first
      if (a.isFinished && !b.isFinished) {
        return -1;
      }
      
      // Only b is finished - b comes first
      if (!a.isFinished && b.isFinished) {
        return 1;
      }
      
      // Neither finished - sort by position (descending)
      return b.currentPosition - a.currentPosition;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Check if a player is currently moving
   */
  isPlayerMoving(playerId: string): boolean {
    return playerId === this.movingPlayerId;
  }

  /**
   * Format finish time for display
   */
  formatFinishTime(finishTime?: Date): string {
    if (!finishTime) {
      return '';
    }
    
    const date = new Date(finishTime);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Get rank display text with special formatting for top 3
   */
  getRankDisplay(rank: number): string {
    return `#${rank}`;
  }

  /**
   * Get CSS class for rank badge
   */
  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  }

  /**
   * Select a player as target
   */
  selectTarget(playerId: string): void {
    // Don't allow selection if dice has been rolled (wait for next turn)
    if (this.hasRolledDice) {
      return;
    }

    // Find the player
    const entry = this.leaderboardEntries.find(e => e.playerId === playerId);
    if (!entry || entry.isFinished) {
      return;
    }

    // Update selection
    this.selectedTargetId = playerId;
    this.gameService.setSelectedTarget(playerId);
    this.targetSelected.emit(playerId);

    // Show token at the selected target's position (Requirements 7.2)
    this.gameService.setShowTokenForPlayer(playerId);

    // Update entries to reflect selection
    this.leaderboardEntries = this.leaderboardEntries.map(e => ({
      ...e,
      isSelected: e.playerId === playerId
    }));
  }

  /**
   * Check if a player name matches the search query (for highlighting)
   */
  isSearchMatch(playerName: string): boolean {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return false;
    }
    return playerName.toLowerCase().includes(this.searchQuery.toLowerCase().trim());
  }

  /**
   * Handle search input change - scroll to first match
   */
  onSearchChange(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return;
    }

    // Find first matching entry
    const firstMatch = this.leaderboardEntries.find(e => 
      this.isSearchMatch(e.playerName)
    );

    if (firstMatch && this.leaderboardContainer) {
      const element = document.getElementById(`leaderboard-${firstMatch.playerId}`);
      const container = this.leaderboardContainer.nativeElement;
      
      if (element && container) {
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
        
        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    }
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery = '';
  }

  /**
   * Check if target can be selected (not rolled yet)
   */
  canSelectTarget(): boolean {
    return !this.hasRolledDice;
  }

  /**
   * Check if a rank is a winning position (Requirements 13.5)
   */
  isWinningPosition(rank: number): boolean {
    return this.winningPositions.includes(rank);
  }

  /**
   * Get the winning icon for a position (Requirements 13.5)
   * 🏆 for #16 (16th anniversary), ⭐ for other positions
   */
  getWinningIcon(rank: number): string {
    if (rank === 16) {
      return '🏆';
    }
    return '⭐';
  }
}
