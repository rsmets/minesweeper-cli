#!/usr/bin/env node

import { MinesweeperCLI } from "./cli";

/**
 * Main entry point for the Minesweeper CLI game
 */
function main(): void {
  try {
    const cli = new MinesweeperCLI();
    cli.start();
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  main();
}
