#!/usr/bin/env node

import { MinesweeperCLI } from "./cli";
import { mainLogger } from "./logger";

/**
 * Main entry point for the Minesweeper CLI game
 */
async function main(): Promise<void> {
  try {
    mainLogger.debug('Starting Minesweeper CLI application');
    const cli = new MinesweeperCLI();
    await cli.start();
    mainLogger.debug('Minesweeper CLI application finished');
  } catch (error) {
    console.error(" An error occurred:", error);
    process.exit(1);
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  main();
}
