/**
 * Simple test script to check if the Polymer Ethers.js plugin is working correctly with ethers v6
 * We will get the latest block from Optimism Sepolia
 * and request a proof from Optimism Sepolia to Base Sepolia
 */

// Load ethers
const { ethers } = require("ethers");

// Load the plugin
const { addPolymerToEthers } = require("../src/polymer-ethers-plugin");

// We have the POLYMER_API_KEY in .env
require("dotenv").config();

// Load CLI helpers
const {
  printHeader,
  printSuccess,
  printInfo,
  printWarning,
  printError,
  printJson,
  banner,
  colors,
} = require("./lib/cli");

// Configuration
const OPTIMISM_SEPOLIA_RPC = "https://sepolia.optimism.io";
const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia Chain ID
const POLYMER_API_KEY = process.env.POLYMER_API_KEY;

// Check for API key
if (!POLYMER_API_KEY) {
  printError("POLYMER_API_KEY environment variable is not set.");
  printError(
    "Please create a .env file with your Polymer API key or set it in your environment."
  );
  process.exit(1);
}

async function main() {
  try {
    // Display logo
    console.log(banner);

    printHeader("POLYMER ETHERS.JS PLUGIN TEST");

    printInfo("Testing connection to Optimism Sepolia...");

    // Create provider for Optimism Sepolia
    const provider = new ethers.JsonRpcProvider(OPTIMISM_SEPOLIA_RPC);

    // Get network information
    const network = await provider.getNetwork();
    printSuccess(
      `Connected to network: ${colors.bright}${network.name}${colors.reset}${colors.green} (Chain ID: ${network.chainId})${colors.reset}`
    );

    // Get latest block number
    const blockNumber = await provider.getBlockNumber();
    printSuccess(
      `Latest block number: ${colors.bright}${blockNumber}${colors.reset}`
    );

    // Initialize Polymer plugin
    printInfo("Initializing Polymer Ethers.js plugin...");
    addPolymerToEthers(ethers, {
      apiKey: POLYMER_API_KEY,
      debug: true,
    });
    printSuccess("Polymer Ethers.js plugin initialized successfully!");

    printHeader("BLOCKCHAIN DATA");

    // Get the latest block
    printInfo("Fetching latest block...");
    const latestBlock = await provider.getBlock("latest");
    printSuccess(
      `Latest block number: ${colors.bright}${latestBlock.number}${colors.reset}`
    );
    printSuccess(`Block hash: ${colors.dim}${latestBlock.hash}${colors.reset}`);
    printSuccess(
      `Timestamp: ${colors.dim}${new Date(
        latestBlock.timestamp * 1000
      ).toLocaleString()}${colors.reset}`
    );
    printSuccess(
      `Transactions: ${colors.bright}${latestBlock.transactions.length}${colors.reset}`
    );

    if (latestBlock.transactions.length > 0) {
      const txIndex = 0; // Use the first transaction in the block
      const txHash = latestBlock.transactions[txIndex];

      printHeader("PROOF GENERATION");

      printInfo(
        `Selected transaction: ${colors.dim}${txHash}${colors.reset} (index: ${txIndex})`
      );

      // Request a proof
      printInfo(
        `Requesting proof from ${colors.magenta}Optimism Sepolia${colors.reset} to ${colors.blue}Base Sepolia${colors.reset}...`
      );
      const jobId = await ethers.polymer.requestProof({
        chainId: Number(network.chainId), // Optimism Sepolia
        targetChainId: BASE_SEPOLIA_CHAIN_ID, // Base Sepolia
        blockNumber: latestBlock.number, // The block number we want to find the transaction in
        txIndex: txIndex, // The index of the transaction that we want to prove in the block
      });

      printSuccess(
        `Proof job created with ID: ${colors.bright}${jobId}${colors.reset}`
      );
      printInfo(
        "Polling for proof result (this may take around 10 seconds)..."
      );

      // Poll for the proof result
      const proofResult = await ethers.polymer.wait(jobId);

      printHeader("PROOF RESULT");

      printSuccess(
        `Status: ${colors.bright}${proofResult.status}${colors.reset}`
      );

      // Create a copy of the result with truncated proof for display
      const displayResult = { ...proofResult };
      if (
        displayResult.proof &&
        typeof displayResult.proof === "string" &&
        displayResult.proof.length > 100
      ) {
        displayResult.proof =
          displayResult.proof.substring(0, 100) + "... (truncated)";
      }

      console.log(`\n${colors.cyan}Proof data:${colors.reset}`);
      printJson(displayResult);
    } else {
      printWarning(
        `No transactions found in block ${latestBlock.number}. Cannot test proof generation.`
      );
    }

    printHeader("TEST COMPLETE");
    printSuccess("All tests completed successfully!");
  } catch (error) {
    printHeader("ERROR");
    printError(error.message);
    console.error(error);
  }
}

// Run the main function
main().catch(console.error);
