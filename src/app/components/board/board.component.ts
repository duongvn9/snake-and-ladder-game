import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { BoardCell, generateBoardLayout, generateSnakesAndLadders } from '../../utils/board-layout.util';
import { SnakeOrLadder } from '../../models/snake-or-ladder.model';
import { GameState } from '../../models/game-state.model';

@Component({
  selector: 'app-board',
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit, OnDestroy {
  boardLayout: BoardCell[] = [];
  snakesAndLadders: SnakeOrLadder[] = [];
  
  // Token animation properties
  movingPlayer: { id: string; name: string; color: string } | null = null;
  tokenPosition: { x: number; y: number } = { x: 0, y: 0 };
  isAnimating: boolean = false;
  
  // Static token display (shown after animation ends)
  staticTokenPlayer: { id: string; name: string; color: string; position: number } | null = null;
  staticTokenPosition: { x: number; y: number } = { x: 0, y: 0 };
  
  private stateSubscription?: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    // Generate board layout
    this.boardLayout = generateBoardLayout();
    
    // Subscribe to game state for snakes and ladders and token visibility
    this.stateSubscription = this.gameService.state$.subscribe(state => {
      if (state) {
        this.snakesAndLadders = state.snakesAndLadders;
        
        // Update static token display based on showTokenForPlayerId
        this.updateStaticTokenDisplay(state);
      } else {
        // Generate preview snakes and ladders when no game state
        this.snakesAndLadders = this.generatePreviewSnakesAndLadders();
        this.staticTokenPlayer = null;
      }
    });
  }

  /**
   * Generate preview snakes and ladders for board preview mode
   */
  private generatePreviewSnakesAndLadders(): SnakeOrLadder[] {
    return generateSnakesAndLadders({ count: 14 });
  }

  /**
   * Update static token display based on game state
   * Shows token for the player specified in showTokenForPlayerId
   */
  private updateStaticTokenDisplay(state: GameState): void {
    // Don't show static token while animating
    if (this.isAnimating) {
      return;
    }

    if (state.showTokenForPlayerId) {
      const player = state.players.find(p => p.id === state.showTokenForPlayerId);
      if (player) {
        this.staticTokenPlayer = {
          id: player.id,
          name: player.name,
          color: player.color,
          position: player.position
        };
        this.updateStaticTokenPosition(player.position);
      } else {
        this.staticTokenPlayer = null;
      }
    } else {
      this.staticTokenPlayer = null;
    }
  }

  /**
   * Update static token position based on board position
   */
  private updateStaticTokenPosition(position: number): void {
    // Handle position 0 (starting position - off the board)
    if (position === 0) {
      this.staticTokenPosition = {
        x: 5, // Center of first column (percentage)
        y: 95 // Below the board (percentage)
      };
      return;
    }

    const cellPos = this.getCellPosition(position);
    if (!cellPos) {
      console.error(`Cannot find cell position for ${position}`);
      return;
    }

    // Calculate percentage position based on cell coordinates
    const cellWidth = 10; // percentage
    const cellHeight = 10; // percentage

    // Center the token in the cell
    this.staticTokenPosition = {
      x: cellPos.x * cellWidth + cellWidth / 2,
      y: (9 - cellPos.y) * cellHeight + cellHeight / 2 // Invert Y for display
    };
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Get cells organized by rows (from top to bottom for display)
   * Returns array of rows, each containing 10 cells
   */
  getBoardRows(): BoardCell[][] {
    const rows: BoardCell[][] = [];
    
    // Group cells by row (y coordinate)
    // Display from top (y=9) to bottom (y=0)
    for (let y = 9; y >= 0; y--) {
      const rowCells = this.boardLayout
        .filter(cell => cell.y === y)
        .sort((a, b) => a.x - b.x);
      rows.push(rowCells);
    }
    
    return rows;
  }

  /**
   * Get cell background color (alternating pattern)
   */
  getCellColor(cell: BoardCell): string {
    // Alternating colors based on position
    const isEven = (cell.x + cell.y) % 2 === 0;
    return isEven ? '#f0e6d2' : '#d4c4a8';
  }

  /**
   * Track by function for ngFor optimization (cells)
   */
  trackByNumber(index: number, cell: BoardCell): number {
    return cell.number;
  }

  /**
   * Track by function for ngFor optimization (rows)
   */
  trackByRowIndex(index: number, _row: BoardCell[]): number {
    return index;
  }

  /**
   * Get snake or ladder at a specific cell
   */
  getSnakeOrLadderAtCell(cellNumber: number): SnakeOrLadder | undefined {
    return this.snakesAndLadders.find(
      element => element.startPosition === cellNumber
    );
  }

  /**
   * Check if cell has a snake or ladder
   */
  hasSnakeOrLadder(cellNumber: number): boolean {
    return !!this.getSnakeOrLadderAtCell(cellNumber);
  }

  /**
   * Get the position (x, y) for a cell number
   */
  getCellPosition(cellNumber: number): { x: number; y: number } | null {
    const cell = this.boardLayout.find(c => c.number === cellNumber);
    return cell ? { x: cell.x, y: cell.y } : null;
  }

  /**
   * Calculate SVG path for snake or ladder
   */
  getSnakeOrLadderPath(element: SnakeOrLadder): string {
    const startPos = this.getCellPosition(element.startPosition);
    const endPos = this.getCellPosition(element.endPosition);
    
    if (!startPos || !endPos) return '';
    
    // Calculate center of cells (each cell is 10% of board width/height)
    const startX = (startPos.x + 0.5) * 10;
    const startY = (9 - startPos.y + 0.5) * 10; // Invert Y for SVG coordinates
    const endX = (endPos.x + 0.5) * 10;
    const endY = (9 - endPos.y + 0.5) * 10;
    
    if (element.type === 'ladder') {
      // Straight line for ladder
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      // Curved path for snake - use deterministic control point based on element id
      // Use a simple hash of the element id to generate consistent offset
      const hashCode = element.id.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      const normalizedHash = (hashCode % 100) / 100; // Normalize to 0-1 range
      const controlX = (startX + endX) / 2 + (normalizedHash - 0.5) * 10;
      const controlY = (startY + endY) / 2 + ((hashCode % 50) / 50 - 0.5) * 10;
      return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    }
  }

  /**
   * Get color for snake or ladder
   */
  getElementColor(element: SnakeOrLadder): string {
    return element.type === 'snake' ? '#dc3545' : '#28a745';
  }

  /**
   * Track by function for snakes and ladders
   */
  trackByElementId(index: number, element: SnakeOrLadder): string {
    return element.id;
  }

  /**
   * Animate token movement from one position to another
   * @param player - Player object with id, name, and color
   * @param fromPosition - Starting position (0-100)
   * @param toPosition - Ending position (0-100)
   * @returns Promise that resolves when animation is complete
   */
  async animateTokenMovement(
    player: { id: string; name: string; color: string },
    fromPosition: number,
    toPosition: number
  ): Promise<void> {
    if (this.isAnimating) {
      console.warn('Animation already in progress');
      return;
    }

    this.isAnimating = true;

    // Show token at starting position
    this.showTokenAtPosition(player, fromPosition);

    // Calculate delay per step to keep total animation under 3 seconds
    const totalSteps = toPosition - fromPosition;
    const maxTotalTime = 3000; // 3 seconds max
    const minDelayPerStep = 100; // Minimum 100ms per step for visibility
    const maxDelayPerStep = 300; // Maximum 300ms per step
    
    // Calculate optimal delay: total time / steps, clamped between min and max
    const calculatedDelay = Math.floor(maxTotalTime / totalSteps);
    const delayPerStep = Math.max(minDelayPerStep, Math.min(maxDelayPerStep, calculatedDelay));

    // Animate step by step
    for (let pos = fromPosition + 1; pos <= toPosition; pos++) {
      await this.delay(delayPerStep);
      this.moveTokenToPosition(pos);
    }

    // Hide token after animation
    await this.delay(200); // Brief pause before hiding
    this.hideToken();

    this.isAnimating = false;
  }

  /**
   * Show token at a specific position
   * @param player - Player object with id, name, and color
   * @param position - Position on the board (0-100)
   */
  private showTokenAtPosition(
    player: { id: string; name: string; color: string },
    position: number
  ): void {
    this.movingPlayer = player;
    this.moveTokenToPosition(position);
  }

  /**
   * Move token to a specific position
   * @param position - Position on the board (0-100)
   */
  private moveTokenToPosition(position: number): void {
    // Handle position 0 (starting position - off the board)
    if (position === 0) {
      // Place token just below cell 1 (bottom-left corner)
      this.tokenPosition = {
        x: 5, // Center of first column (percentage)
        y: 95 // Below the board (percentage)
      };
      return;
    }

    const cellPos = this.getCellPosition(position);
    if (!cellPos) {
      console.error(`Cannot find cell position for ${position}`);
      return;
    }

    // Calculate pixel position based on cell coordinates
    // Each cell is 10% of board width/height
    const cellWidth = 10; // percentage
    const cellHeight = 10; // percentage

    // Center the token in the cell
    this.tokenPosition = {
      x: cellPos.x * cellWidth + cellWidth / 2,
      y: (9 - cellPos.y) * cellHeight + cellHeight / 2 // Invert Y for display
    };
  }

  /**
   * Hide the moving token
   */
  private hideToken(): void {
    this.movingPlayer = null;
  }

  /**
   * Delay helper for animations
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Animate special move (snake or ladder)
   * @param player - Player object with id, name, and color
   * @param special - SnakeOrLadder element
   * @returns Promise that resolves when animation is complete
   */
  async animateSpecialMove(
    player: { id: string; name: string; color: string },
    special: SnakeOrLadder
  ): Promise<void> {
    if (this.isAnimating) {
      console.warn('Animation already in progress');
      return;
    }

    this.isAnimating = true;

    // Show token at start position
    this.showTokenAtPosition(player, special.startPosition);
    await this.delay(400); // Brief pause at start

    if (special.type === 'ladder') {
      // Ladder climb animation - smooth upward movement
      await this.animateLadderClimb(special.startPosition, special.endPosition);
    } else {
      // Snake slide animation - smooth downward movement
      await this.animateSnakeSlide(special.startPosition, special.endPosition);
    }

    await this.delay(400); // Brief pause at end

    // Hide token
    this.hideToken();

    this.isAnimating = false;
  }

  /**
   * Animate ladder climb with smooth upward movement
   * @param startPosition - Bottom of ladder
   * @param endPosition - Top of ladder
   * @returns Promise that resolves when animation is complete
   */
  private async animateLadderClimb(
    startPosition: number,
    endPosition: number
  ): Promise<void> {
    // Add climbing class for special animation
    const tokenElement = document.querySelector('.moving-token');
    tokenElement?.classList.add('climbing-ladder');

    // Faster transition for special moves (150ms instead of 300ms)
    const originalTransition = this.getTokenTransitionDuration();
    this.setTokenTransitionDuration(150);

    // Move directly to end position with smooth animation
    this.moveTokenToPosition(endPosition);
    await this.delay(600); // Wait for animation to complete

    // Remove climbing class
    tokenElement?.classList.remove('climbing-ladder');
    
    // Restore original transition
    this.setTokenTransitionDuration(originalTransition);
  }

  /**
   * Animate snake slide with smooth downward movement
   * @param startPosition - Head of snake
   * @param endPosition - Tail of snake
   * @returns Promise that resolves when animation is complete
   */
  private async animateSnakeSlide(
    startPosition: number,
    endPosition: number
  ): Promise<void> {
    // Add sliding class for special animation
    const tokenElement = document.querySelector('.moving-token');
    tokenElement?.classList.add('sliding-snake');

    // Faster transition for special moves (150ms instead of 300ms)
    const originalTransition = this.getTokenTransitionDuration();
    this.setTokenTransitionDuration(150);

    // Move directly to end position with smooth animation
    this.moveTokenToPosition(endPosition);
    await this.delay(600); // Wait for animation to complete

    // Remove sliding class
    tokenElement?.classList.remove('sliding-snake');
    
    // Restore original transition
    this.setTokenTransitionDuration(originalTransition);
  }

  /**
   * Get current token transition duration from CSS
   * @returns Duration in milliseconds
   */
  private getTokenTransitionDuration(): number {
    const tokenElement = document.querySelector('.moving-token') as HTMLElement;
    if (!tokenElement) return 300;

    const style = window.getComputedStyle(tokenElement);
    const transition = style.transition || style.webkitTransition;
    
    // Parse transition duration (e.g., "left 300ms ease-in-out, top 300ms ease-in-out")
    const match = transition.match(/(\d+)ms/);
    return match ? parseInt(match[1], 10) : 300;
  }

  /**
   * Set token transition duration dynamically
   * @param durationMs - Duration in milliseconds
   */
  private setTokenTransitionDuration(durationMs: number): void {
    const tokenElement = document.querySelector('.moving-token') as HTMLElement;
    if (tokenElement) {
      tokenElement.style.transition = `left ${durationMs}ms ease-in-out, top ${durationMs}ms ease-in-out`;
    }
  }
}
