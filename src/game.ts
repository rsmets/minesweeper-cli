import {
  GameConfig,
  Position,
  Cell,
  CellState,
  GameStatus,
  GameState,
} from "./types";

export class MinesweeperGame {
  private config: GameConfig;
  private state: GameState;

  constructor(config: GameConfig) {
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
  }

  /**
   * Initialize empty grid with hidden cells
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
   */
  private placeBombs(): void {
    const totalCells = this.config.width * this.config.height;
    const totalBombs = Math.floor(
      (totalCells * this.config.bombPercentage) / 100
    );

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
    }
  }

  /**
   * Calculate adjacent bomb counts for all cells
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
   */
  public revealCell(pos: Position): boolean {
    if (
      !this.isValidPosition(pos) ||
      this.state.status !== GameStatus.PLAYING
    ) {
      return false;
    }

    const cell = this.state.grid[pos.row][pos.col];

    // Can't reveal flagged or already revealed cells
    if (cell.state === CellState.FLAGGED || cell.state === CellState.REVEALED) {
      return false;
    }

    // Check if clicked on bomb
    if (cell.isBomb) {
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
   */
  public getGameState(): Readonly<GameState> {
    return this.state;
  }

  /**
   * Get game configuration (read-only)
   */
  public getConfig(): Readonly<GameConfig> {
    return this.config;
  }
}
