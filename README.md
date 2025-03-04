# Polymer Ethers Plugin

A plugin for Ethers.js v6 that adds Polymer proof capabilities, allowing you to request proofs for transactions across different blockchains.

## Overview

The Polymer Ethers Plugin extends Ethers.js with the ability to generate proofs from the Polymer Prove API for transactions. These proofs can be used to verify the existence and validity of transaction events across different blockchains, enabling secure cross-chain communication.

### What is Polymer?

Polymer makes cross-rollup interoperability fast and easy for application builders. Find out more at [Polymer Labs](https://www.polymerlabs.org).

## Installation

```bash
npm install @stevenlei/polymer-ethers-plugin ethers
```

## Usage

### Standalone API Usage

```javascript
const { ethers } = require("ethers");
const { addPolymerToEthers } = require("@stevenlei/polymer-ethers-plugin");

// Initialize the plugin with your API key
addPolymerToEthers(ethers, {
  apiKey: process.env.POLYMER_API_KEY,
});

// Request a proof for a specific block and transaction
const jobId = await ethers.polymer.requestProof({
  chainId: 11155420, // Optimism Sepolia
  targetChainId: 84532, // Base Sepolia (required, must be different from source chain)
  blockNumber: 123456,
  txIndex: 0,
});

// Wait for the proof to be generated
const proofResult = await ethers.polymer.wait(jobId);
console.log("Proof:", proofResult);
```

### With Transaction Receipt

```javascript
const { ethers } = require("ethers");
const { addPolymerToEthers } = require("@stevenlei/polymer-ethers-plugin");

// Initialize the plugin with your API key
addPolymerToEthers(ethers, {
  apiKey: process.env.POLYMER_API_KEY,
});

// Load a transaction receipt (in this example, we use a known good receipt from Optimism Sepolia)
const receipt = await ethers.provider.getTransactionReceipt(
  "0x5138b0d6ffe7bfe8f1d7dca24d396dab804fa664930ef96bb9e6ebbc86426fbb"
);
const jobId = await receipt.polymerProof({
  targetChainId: 84532, // Base Sepolia (required, must be different from source chain)
});

// Wait for the proof to be generated
const proofResult = await ethers.polymer.wait(jobId);
console.log("Proof:", proofResult);
```

## API Reference

### Plugin Configuration

When initializing the plugin, you can provide the following configuration options:

```javascript
addPolymerToEthers(ethers, {
  apiKey: "YOUR_API_KEY", // Required
  apiUrl: "POLYMER_API_URL", // Optional, defaults to Polymer testnet
  maxAttempts: 20, // Optional, default: 20
  interval: 3000, // Optional, default: 3000ms
  timeout: 60000, // Optional, default: 60000ms
  debug: false, // Optional, default: false
});
```

### Configuration Options

| Option      | Description                        | Default                            |
| ----------- | ---------------------------------- | ---------------------------------- |
| apiKey      | Your Polymer API key (required)    | null                               |
| apiUrl      | URL of the Polymer API             | https://proof.testnet.polymer.zone |
| maxAttempts | Maximum number of polling attempts | 20                                 |
| interval    | Polling interval in milliseconds   | 3000                               |
| timeout     | Request timeout in milliseconds    | 60000                              |
| debug       | Enable debug logging               | false                              |

### Methods

The plugin adds the following methods to the ethers library:

| Method                        | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| ethers.polymer.requestProof   | Request a proof for a specific block and transaction     |
| ethers.polymer.wait           | Wait for a proof to be generated (replaces pollForProof) |
| ethers.polymer.getProofStatus | Check the status of a proof generation job               |
| receipt.polymerProof          | Request a proof for a transaction receipt                |
| receipt.polymerProofStatus    | Check the status of a proof for a transaction receipt    |

#### ethers.polymer.requestProof(options)

Requests a proof for a specific block and transaction.

**Parameters:**

- `options` (Object):
  - `chainId` (number): The source chain ID
  - `targetChainId` (number, required): The destination chain ID (must be different from source chain)
  - `blockNumber` (number): The block number
  - `txIndex` (number): The transaction index in the block

**Returns:**

- `Promise<string>`: A promise that resolves to the job ID

#### ethers.polymer.wait(jobId, maxAttempts, interval)

Waits for a proof to be generated. This method replaces the previous `pollForProof` method.

**Parameters:**

- `jobId` (string): The job ID from the proof request
- `maxAttempts` (number, optional): Maximum number of polling attempts
- `interval` (number, optional): Polling interval in milliseconds

**Returns:**

- `Promise<Object>`: A promise that resolves to the proof result

#### ethers.polymer.getProofStatus(jobId)

Checks the status of a proof generation job.

**Parameters:**

- `jobId` (string): The job ID from the proof request

**Returns:**

- `Promise<Object>`: A promise that resolves to the job status

#### receipt.polymerProof(options)

Requests a proof for a transaction receipt.

**Parameters:**

- `options` (Object):
  - `targetChainId` (number, required): The destination chain ID (must be different from source chain)
  - `maxAttempts` (number, optional): Maximum number of polling attempts
  - `interval` (number, optional): Polling interval in milliseconds
  - `returnJob` (boolean, optional): If true, returns the job ID without waiting

**Returns:**

- `Promise<Object>`: A promise that resolves to the proof result or job ID

#### receipt.polymerProofStatus(jobId)

Checks the status of a proof for a transaction receipt.

**Parameters:**

- `jobId` (string): The job ID from the proof request

**Returns:**

- `Promise<Object>`: A promise that resolves to the job status

## Examples

Check out the `examples` directory for complete working examples.

To run the example:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your Polymer API key:

   ```bash
   cp .env.example .env
   # Edit .env and add your Polymer API key
   ```

3. Run the example:

   ```bash
   npm run standalone # Standalone API
   npm run receipt # With Transaction Receipt
   ```

## License

MIT
