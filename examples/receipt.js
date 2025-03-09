/**
 * Example script demonstrating how to generate a proof for an existing transaction
 * This loads a transaction by hash and calls polymerProof() directly on the transaction receipt
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
  printError,
  printJson,
  banner,
  colors,
} = require("./lib/cli");

// Configuration
const OPTIMISM_SEPOLIA_RPC = "https://sepolia.optimism.io";
const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia Chain ID
const POLYMER_API_KEY = process.env.POLYMER_API_KEY;

// Transaction hash to get proof for
// This should be a valid transaction hash on Optimism Sepolia
const TX_HASH =
  "0x5138b0d6ffe7bfe8f1d7dca24d396dab804fa664930ef96bb9e6ebbc86426fbb";

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

    printHeader("POLYMER ETHERS.JS TX PROOF EXAMPLE");

    printInfo("Connecting to Optimism Sepolia...");

    // Create provider for Optimism Sepolia
    const provider = new ethers.JsonRpcProvider(OPTIMISM_SEPOLIA_RPC);

    // Get network information
    const network = await provider.getNetwork();
    printSuccess(
      `Connected to network: ${colors.bright}${network.name}${colors.reset}${colors.green} (Chain ID: ${network.chainId})${colors.reset}`
    );

    // Initialize Polymer plugin
    printInfo("Initializing Polymer Ethers.js plugin...");
    addPolymerToEthers(ethers, {
      apiKey: POLYMER_API_KEY,
      debug: true,
    });
    printSuccess("Polymer Ethers.js plugin initialized successfully!");

    printHeader("TRANSACTION DATA");

    // Get the transaction
    printInfo(`Fetching transaction: ${colors.dim}${TX_HASH}${colors.reset}`);
    const tx = await provider.getTransaction(TX_HASH);

    if (!tx) {
      printError(`Transaction not found: ${TX_HASH}`);
      process.exit(1);
    }

    printSuccess(`Transaction found!`);
    printSuccess(
      `Block number: ${colors.bright}${tx.blockNumber}${colors.reset}`
    );
    printSuccess(`From: ${colors.dim}${tx.from}${colors.reset}`);
    printSuccess(`To: ${colors.dim}${tx.to}${colors.reset}`);

    // Get the transaction receipt
    printInfo("Fetching transaction receipt...");
    const receipt = await provider.getTransactionReceipt(TX_HASH);

    if (!receipt) {
      printError("Transaction receipt not found");
      process.exit(1);
    }

    printSuccess(
      `Transaction index: ${colors.bright}${receipt.index}${colors.reset}`
    );
    printSuccess(
      `Status: ${
        receipt.status === 1
          ? colors.green + "Success" + colors.reset
          : colors.red + "Failed" + colors.reset
      }`
    );

    printHeader("PROOF GENERATION");

    // Request a proof directly from the transaction receipt
    printInfo(
      `Requesting proof from ${colors.magenta}Optimism Sepolia${colors.reset}...`
    );

    // Call polymerProof directly on the transaction receipt
    const { jobId } = await receipt.polymerProof({
      logIndex: 1,
      // eventSignature: "ValueSet(address,string,bytes,uint256,bytes32,uint256)",
      returnJob: true, // Return the job ID instead of waiting for the proof
    });

    printSuccess(
      `Proof job created with ID: ${colors.bright}${jobId}${colors.reset}`
    );
    printInfo("Waiting for proof result (this may take around 10 seconds)...");

    // Wait for the proof result using the standalone API
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

    printHeader("EXAMPLE COMPLETE");
    printSuccess("Successfully generated proof for existing transaction!");
  } catch (error) {
    printHeader("ERROR");
    printError(error.message);
    console.error(error);
  }
}

// Run the main function
main().catch(console.error);
