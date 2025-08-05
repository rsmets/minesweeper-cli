import {
  GameConfig,
  Position,
  Cell,
  CellState,
  GameStatus,
  GameState,
} from "./types";
import { gameLogger } from "./logger";

export class MinesweeperGame {
  private config: GameConfig;
  private state: GameState;

  /**
   * Create a new Minesweeper game instance
   * Initializes the grid, places bombs, and calculates adjacent bomb counts
   *
   * @param config - Game configuration including grid dimensions and bomb percentage
   */
  constructor(config: GameConfig) {
    gameLogger.debug("Initializing new MinesweeperGame", { config });
    this.config = config;
    this.state = {
      grid: this.initializeGrid(),
      status: GameStatus.PLAYING,
      revealedCells: 0,
      totalSafeCells: 0,
    };

    // Calculate total safe cells (total cells minus bombs)
    const totalCells = this.config.width * this.config.height;
    const totalBombs = Math.floor(
      (totalCells * this.config.bombPercentage) / 100
    );
    this.state.totalSafeCells = totalCells - totalBombs;

    // Always generate bombs during initialization
    this.placeBombs();
    this.calculateAdjacentBombs();
    gameLogger.debug("MinesweeperGame initialization complete");
  }

  /**
   * Initialize empty grid with hidden cells
   * Creates a 2D array of cells, all starting as hidden and bomb-free
   *
   * @returns 2D array of Cell objects representing the game grid
   */
  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let row = 0; row < this.config.height; row++) {
      grid[row] = [];
      for (let col = 0; col < this.config.width; col++) {
        grid[row][col] = {
          isBomb: false,
          adjacentBombs: 0,
          state: CellState.HIDDEN,
        };
      }
    }
    return grid;
  }

  /**
   * Place bombs randomly on the grid
   * Calculates bomb count based on percentage and randomly distributes them
   *
   * @returns void
   */
  private placeBombs(): void {
    const totalCells = this.config.width * this.config.height;
    const totalBombs = Math.floor(
      (totalCells * this.config.bombPercentage) / 100
    );

    gameLogger.debug("Placing bombs", {
      totalCells,
      totalBombs,
      bombPercentage: this.config.bombPercentage,
    });

    // Flattened array of all available positions
    const availablePositions: Position[] = [];

    // Collect all available positions
    for (let row = 0; row < this.config.height; row++) {
      for (let col = 0; col < this.config.width; col++) {
        availablePositions.push({ row, col });
      }
    }

    // Randomly select bomb positions
    for (let i = 0; i < totalBombs && availablePositions.length > 0; i++) {
      // Select a random index to remove from the available positions array
      const randomIndex = Math.floor(Math.random() * availablePositions.length);

      // Remove the selected position from the array and store it in `bombPos`
      const bombPos = availablePositions.splice(randomIndex, 1)[0];

      // Mark the selected position as a bomb in the game state grid
      this.state.grid[bombPos.row][bombPos.col].isBomb = true;
      gameLogger.trace("Bomb placed at position", { position: bombPos });
    }

    gameLogger.debug("Bomb placement complete", {
      totalBombsPlaced: totalBombs,
    });
  }

  /**
   * Calculate adjacent bomb counts for all cells
   * Iterates through all non-bomb cells and counts neighboring bombs
   *
   * @returns void
   */
  private calculateAdjacentBombs(): void {
    for (let row = 0; row < this.config.height; row++) {
      for (let col = 0; col < this.config.width; col++) {
        if (!this.state.grid[row][col].isBomb) {
          this.state.grid[row][col].adjacentBombs = this.countAdjacentBombs({
            row,
            col,
          });
        }
      }
    }
  }

  /**
   * Count bombs in the 8 adjacent cells (including diagonals)
   * Checks all 8 surrounding cells for bombs and returns the total count
   *
   * @param pos - The position to check around
   * @returns Number of bombs in adjacent cells (0-8)
   */
  private countAdjacentBombs(pos: Position): number {
    let count = 0;
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dRow, dCol] of directions) {
      const newRow = pos.row + dRow;
      const newCol = pos.col + dCol;

      if (
        this.isValidPosition({ row: newRow, col: newCol }) &&
        this.state.grid[newRow][newCol].isBomb
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check if position is within grid bounds
   * Validates that row and column are within the game grid dimensions
   *
   * @param pos - The position to validate
   * @returns true if position is valid, false otherwise
   */
  private isValidPosition(pos: Position): boolean {
    return (
      pos.row >= 0 &&
      pos.row < this.config.height &&
      pos.col >= 0 &&
      pos.col < this.config.width
    );
  }

  /**
   * Reveal a cell and handle game logic
   * Handles bomb detection, recursive revealing, and win condition checking
   *
   * @param pos - The position of the cell to reveal
   * @returns true if the action was successful, false if invalid
   */
  public revealCell(pos: Position): boolean {
    gameLogger.debug("Attempting to reveal cell", { position: pos });

    if (
      !this.isValidPosition(pos) ||
      this.state.status !== GameStatus.PLAYING
    ) {
      gameLogger.trace(
        "Cell reveal failed - invalid position or game not playing",
        { position: pos, gameStatus: this.state.status }
      );
      return false;
    }

    const cell = this.state.grid[pos.row][pos.col];

    // Can't reveal flagged or already revealed cells
    if (cell.state === CellState.FLAGGED || cell.state === CellState.REVEALED) {
      return false;
    }

    // Check if clicked on bomb
    if (cell.isBomb) {
      gameLogger.debug("Player hit a bomb - game over", { position: pos });
      this.state.status = GameStatus.LOST;
      this.revealAllBombs();
      return true;
    }

    // Reveal the cell
    this.revealCellRecursive(pos);

    // Check win condition
    if (this.state.revealedCells === this.state.totalSafeCells) {
      this.state.status = GameStatus.WON;
    }

    return true;
  }

  /**
   * Recursively reveal cells (flood fill for empty cells)
   * Reveals the cell and continues to adjacent cells if no bombs are nearby
   *
   * @param pos - The position of the cell to reveal recursively
   * @returns void
   */
  private revealCellRecursive(pos: Position): void {
    if (!this.isValidPosition(pos)) return;

    const cell = this.state.grid[pos.row][pos.col];

    // Skip if already revealed, flagged, or is a bomb
    if (
      cell.state === CellState.REVEALED ||
      cell.state === CellState.FLAGGED ||
      cell.isBomb
    ) {
      return;
    }

    // Reveal this cell
    cell.state = CellState.REVEALED;
    this.state.revealedCells++;

    // If cell has no adjacent bombs, recursively reveal neighbors
    if (cell.adjacentBombs === 0) {
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dRow, dCol] of directions) {
        this.revealCellRecursive({
          row: pos.row + dRow,
          col: pos.col + dCol,
        });
      }
    }
  }

  /**
   * Reveal all bombs (called when game is lost)
   * Makes all bomb cells visible on the grid for game over display
   *
   * @returns void
   */
  private revealAllBombs(): void {
    for (let row = 0; row < this.config.height; row++) {
      for (let col = 0; col < this.config.width; col++) {
        if (this.state.grid[row][col].isBomb) {
          this.state.grid[row][col].state = CellState.REVEALED;
        }
      }
    }
  }

  /**
   * Toggle flag on a cell
   * Switches between flagged and hidden states for unrevealed cells
   *
   * @param pos - The position of the cell to flag/unflag
   * @returns true if the action was successful, false if invalid
   */
  public toggleFlag(pos: Position): boolean {
    if (
      !this.isValidPosition(pos) ||
      this.state.status !== GameStatus.PLAYING
    ) {
      return false;
    }

    const cell = this.state.grid[pos.row][pos.col];

    // Can't flag revealed cells
    if (cell.state === CellState.REVEALED) {
      return false;
    }

    // Toggle flag state
    cell.state =
      cell.state === CellState.FLAGGED ? CellState.HIDDEN : CellState.FLAGGED;
    return true;
  }

  /**
   * Get current game state (read-only)
   * Provides access to the current game state without allowing modifications
   *
   * @returns Read-only copy of the current game state
   */
  public getGameState(): Readonly<GameState> {
    return this.state;
  }

  /**
   * Get game configuration (read-only)
   * Provides access to the game configuration without allowing modifications
   *
   * @returns Read-only copy of the game configuration
   */
  public getConfig(): Readonly<GameConfig> {
    return this.config;
  }
}
