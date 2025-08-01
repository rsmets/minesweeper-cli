import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { MinesweeperGame } from "./game";
import { GameConfig, Position, CellState, GameStatus } from "./types";

export class MinesweeperCLI {
  private game: MinesweeperGame | null = null;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({ input, output });
  }

  /**
   * Start the CLI application
   */
  public async start(): Promise<void> {
    console.log("\n🎮 Welcome to Minesweeper CLI! 🎮\n");

    try {
      const config = await this.getGameConfiguration();
      this.game = new MinesweeperGame(config);

      console.log(
        '\n🎯 Game started! Use coordinates like "A1" to reveal cells, or "F A1" to flag/unflag.'
      );
      console.log(
        "📋 Commands: [coordinate] to reveal, F [coordinate] to flag, Q to quit\n"
      );

      await this.gameLoop();
    } finally {
      this.rl.close();
    }
  }

  /**
   * Prompt user for game configuration (grid size and bomb percentage)
   */
  private async getGameConfiguration(): Promise<GameConfig> {
    console.log("⚙️  Game Configuration");
    console.log("=".repeat(20));

    // Get grid width
    const widthStr = await this.rl.question("Enter grid width (e.g., 10): ");
    const width = this.validateNumber(widthStr, 3, 50, "width");

    // Get grid height
    const heightStr = await this.rl.question("Enter grid height (e.g., 10): ");
    const height = this.validateNumber(heightStr, 3, 50, "height");

    // Get bomb percentage
    const bombPercentageStr = await this.rl.question(
      "Enter bomb percentage (e.g., 15.5): "
    );
    const bombPercentage = this.validateNumber(
      bombPercentageStr,
      5,
      40,
      "bomb percentage"
    );

    return {
      width,
      height,
      bombPercentage,
    };
  }

  /**
   * Validate and parse numeric input
   */
  private validateNumber(
    input: string,
    min: number,
    max: number,
    fieldName: string
  ): number {
    const num = parseFloat(input.trim());
    if (isNaN(num) || num < min || num > max) {
      throw new Error(
        `Invalid ${fieldName}. Please enter a number between ${min} and ${max}.`
      );
    }
    return num;
  }

  /**
   * Main game loop - handle user input and game state
   */
  private async gameLoop(): Promise<void> {
    while (
      this.game &&
      this.game.getGameState().status === GameStatus.PLAYING
    ) {
      this.displayBoard();

      const input = (await this.rl.question("\nEnter command: "))
        .trim()
        .toUpperCase();

      if (input === "Q" || input === "QUIT") {
        console.log("\n👋 Thanks for playing!");
        return;
      }

      this.processInput(input);
    }

    // Game ended - show final state
    this.displayBoard();
    this.displayGameResult();
  }

  /**
   * Process user input (reveal cell, flag cell, etc.)
   */
  private processInput(input: string): void {
    if (!this.game) return;

    const parts = input.split(" ").filter((part) => part.length > 0);

    if (parts.length === 0) {
      console.log(
        '❌ Invalid input. Use format like "A1" to reveal or "F A1" to flag.'
      );
      return;
    }

    // Check if it's a flag command
    const isFlag = parts[0] === "F" || parts[0] === "FLAG";
    const coordinate = isFlag ? parts[1] : parts[0];

    if (!coordinate) {
      console.log("❌ Please specify a coordinate (e.g., A1).");
      return;
    }

    const position = this.parseCoordinate(coordinate);
    if (!position) {
      console.log('❌ Invalid coordinate format. Use format like "A1".');
      return;
    }

    // Execute the action
    if (isFlag) {
      const success = this.game.toggleFlag(position);
      if (!success) {
        console.log("❌ Cannot flag this cell.");
      }
    } else {
      const success = this.game.revealCell(position);
      if (!success) {
        console.log("❌ Cannot reveal this cell.");
      }
    }
  }

  /**
   * Parse coordinate string (e.g., "A1") to Position object
   */
  private parseCoordinate(coordinate: string): Position | null {
    if (coordinate.length < 2) return null;

    const colChar = coordinate[0];
    const rowStr = coordinate.slice(1);

    // Convert column letter to number (A=0, B=1, etc.)
    const col = colChar.charCodeAt(0) - "A".charCodeAt(0);
    const row = parseInt(rowStr) - 1; // Convert to 0-based index

    if (isNaN(row) || col < 0 || row < 0) {
      return null;
    }

    // Validate bounds
    const config = this.game?.getConfig();
    if (!config || col >= config.width || row >= config.height) {
      return null;
    }

    return { row, col };
  }

  /**
   * Display the current game board
   */
  private displayBoard(): void {
    if (!this.game) return;

    const state = this.game.getGameState();
    const config = this.game.getConfig();

    console.log("\n" + "=".repeat(config.width * 4 + 4));

    // Print column headers
    process.stdout.write("   ");
    for (let col = 0; col < config.width; col++) {
      const colLetter = String.fromCharCode("A".charCodeAt(0) + col);
      process.stdout.write(` ${colLetter} `);
    }
    console.log();

    // Print rows with row numbers
    for (let row = 0; row < config.height; row++) {
      process.stdout.write(`${(row + 1).toString().padStart(2)} `);

      for (let col = 0; col < config.width; col++) {
        const cell = state.grid[row][col];
        let symbol = "";

        if (cell.state === CellState.FLAGGED) {
          symbol = " F ";
        } else if (cell.state === CellState.HIDDEN) {
          symbol = " . ";
        } else if (cell.state === CellState.REVEALED) {
          if (cell.isBomb) {
            symbol = " * ";
          } else if (cell.adjacentBombs === 0) {
            symbol = "   ";
          } else {
            symbol = ` ${cell.adjacentBombs} `;
          }
        }

        process.stdout.write(symbol);
      }
      console.log();
    }

    console.log("=".repeat(config.width * 4 + 4));
  }

  /**
   * Display game result (win/lose message)
   */
  private displayGameResult(): void {
    if (!this.game) return;

    const status = this.game.getGameState().status;

    if (status === GameStatus.WON) {
      console.log("\n🎉 Congratulations! You won! 🎉");
    } else if (status === GameStatus.LOST) {
      console.log("\n💥 Game Over! You hit a bomb! 💥");
    }

    console.log("\n👋 Thanks for playing Minesweeper!");
  }
}
