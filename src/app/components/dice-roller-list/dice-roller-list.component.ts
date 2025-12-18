import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { Player } from '../../models/player.model';
import { GameState } from '../../models/game-state.model';

@Component({
  selector: 'app-dice-roller-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dice-roller-list.component.html',
  styleUrl: './dice-roller-list.component.scss'
})
export class DiceRollerListComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('playerListContainer') playerListContainer?: ElementRef<HTMLDivElement>;

  sortedPlayers: Player[] = [];
  currentRollerId: string | null = null;
  private stateSubscription?: Subscription;
  private shouldScrollToCurrentPlayer = false;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    // Subscribe to game state changes
    this.stateSubscription = this.gameService.state$.subscribe(state => {
      if (state) {
        this.updateFromState(state);
      }
    });
  }

  ngAfterViewChecked(): void {
    // Scroll to current player after view is updated
    if (this.shouldScrollToCurrentPlayer) {
      this.scrollToCurrentPlayer();
      this.shouldScrollToCurrentPlayer = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Update component state from game state
   */
  private updateFromState(state: GameState): void {
    // Get active players (not finished)
    const activePlayers = state.players.filter(p => !p.isFinished);
    
    // Sort players by turnOrder (original player list order)
    this.sortedPlayers = [...activePlayers].sort((a, b) => a.turnOrder - b.turnOrder);

    // Check if current roller changed
    const previousRollerId = this.currentRollerId;
    this.currentRollerId = state.currentDiceRollerId;

    // Trigger scroll if roller changed
    if (previousRollerId !== this.currentRollerId && this.currentRollerId) {
      this.shouldScrollToCurrentPlayer = true;
    }
  }

  /**
   * Scroll to the current player in the list
   * Uses the container's scrollIntoView within the overflow container
   */
  private scrollToCurrentPlayer(): void {
    if (!this.currentRollerId || !this.playerListContainer) {
      return;
    }

    const element = document.getElementById(`player-${this.currentRollerId}`);
    const container = this.playerListContainer.nativeElement;
    
    if (element && container) {
      // Calculate the scroll position to center the element
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

  /**
   * Check if a player is the current roller
   */
  isCurrentRoller(playerId: string): boolean {
    return playerId === this.currentRollerId;
  }
}
