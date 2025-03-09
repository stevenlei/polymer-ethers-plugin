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
      printInfo("Searching for a transaction with logs...");

      // We need to check transaction receipts to find one with logs
      let txWithLogsIndex = -1;
      let txWithLogsHash = null;

      // Check up to 5 transactions to find one with logs (to avoid checking too many)
      const maxTxToCheck = Math.min(5, latestBlock.transactions.length);

      for (let i = 0; i < maxTxToCheck; i++) {
        const txHash = latestBlock.transactions[i];
        const receipt = await provider.getTransactionReceipt(txHash);

        if (receipt && receipt.logs && receipt.logs.length > 0) {
          txWithLogsIndex = i;
          txWithLogsHash = txHash;
          printSuccess(
            `Found transaction with ${receipt.logs.length} logs at index ${i}`
          );
          break;
        }
      }

      if (txWithLogsIndex === -1) {
        printWarning(
          `No transactions with logs found in the first ${maxTxToCheck} transactions of block ${latestBlock.number}. Please restart the script.`
        );
        return;
      }

      const txIndex = txWithLogsIndex;
      const txHash = txWithLogsHash;

      printHeader("PROOF GENERATION");

      printInfo(
        `Selected transaction: ${colors.dim}${txHash}${colors.reset} (index: ${txIndex})`
      );

      // Request a proof
      printInfo(
        `Requesting proof from ${colors.magenta}Optimism Sepolia${colors.reset}...`
      );
      const jobId = await ethers.polymer.requestProof({
        srcChainId: Number(network.chainId),
        srcBlockNumber: latestBlock.number,
        txIndex,
        logIndex: 0 /* for demo purposes, use the first log of the transaction */,
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
