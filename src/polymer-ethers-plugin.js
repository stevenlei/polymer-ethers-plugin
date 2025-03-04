/**
 * Polymer Ethers.js Plugin
 * ========================
 *
 * This plugin extends Ethers.js v6 TransactionResponse objects with Polymer proof capabilities.
 * Browser-compatible version.
 *
 * Usage:
 * ```javascript
 * // Import the plugin and ethers
 * import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.umd.min.js";
 * import { addPolymerToEthers } from "./polymer-ethers-plugin.js";
 *
 * // Initialize the plugin
 * addPolymerToEthers(ethers, {
 *   apiKey: "YOUR_POLYMER_API_KEY",
 *   apiUrl: "https://proof.testnet.polymer.zone"
 * });
 *
 * // Now all transaction objects will have Polymer methods
 * const tx = await contract.someFunction();
 * await tx.wait();
 *
 * // Get Polymer proof (returns the raw proof)
 * const proof = await tx.polymerProof({
 *   targetChainId: 84532, // Base Sepolia
 * });
 *
 * // Advanced usage with maxAttempts and interval
 * const proof = await tx.polymerProof({
 *   targetChainId: 84532, // Base Sepolia
 *   maxAttempts: 20,      // Maximum polling attempts
 *   interval: 3000        // Polling interval in ms
 * });
 * ```
 */

/**
 * Default configuration for the Polymer plugin
 */
const DEFAULT_CONFIG = {
  apiUrl: "https://proof.testnet.polymer.zone",
  apiKey: null,
  maxAttempts: 20,
  interval: 3000,
  timeout: 60000,
  debug: false,
};

/**
 * Adds Polymer proof capabilities to the ethers.js TransactionResponse objects
 *
 * @param {Object} ethers - The ethers.js library
 * @param {Object} config - Configuration object
 * @param {string} config.apiKey - Your Polymer API key
 * @param {string} [config.apiUrl] - Polymer API URL (default: 'https://proof.testnet.polymer.zone')
 * @param {number} [config.maxAttempts] - Maximum polling attempts (default: 20)
 * @param {number} [config.interval] - Polling interval in ms (default: 3000)
 * @param {number} [config.timeout] - Request timeout in ms (default: 60000)
 * @param {boolean} [config.debug] - Enable debug logging (default: false)
 */
function addPolymerToEthers(ethers, config = {}) {
  const polymerConfig = { ...DEFAULT_CONFIG, ...config };
  const logger = createLogger(polymerConfig.debug);

  if (!polymerConfig.apiKey) {
    throw new Error("Polymer API key is required");
  }

  logger.log("Initializing Polymer Ethers plugin with config:", polymerConfig);

  // Extend TransactionResponse prototype for ethers v6
  if (
    ethers.TransactionResponse &&
    !ethers.TransactionResponse.prototype.polymerProof
  ) {
    /**
     * Request and retrieve a Polymer proof for this transaction
     *
     * @param {Object} options - Options for proof generation
     * @param {number} options.targetChainId - Target chain ID (required, must be different from source)
     * @param {number} [options.maxAttempts] - Maximum polling attempts
     * @param {number} [options.interval] - Polling interval in ms
     * @param {boolean} [options.returnJob] - If true, returns the job object instead of the proof
     * @returns {Promise<string|Object>} The proof as a hex string or the job object
     */
    ethers.TransactionResponse.prototype.polymerProof = async function (
      options = {}
    ) {
      const receipt = await this.wait();
      if (!receipt) {
        throw new Error("Transaction receipt not available");
      }

      // Get chainId from the transaction if not specified in provider
      const chainId =
        this.chainId ||
        (this.provider && (await this.provider.getNetwork())).chainId;
      if (!chainId) {
        throw new Error("Chain ID not found in transaction or provider");
      }

      // Extract parameters for Polymer API
      const srcChainId = Number(chainId);
      const blockNumber = receipt.blockNumber;
      const txIndex = receipt.index;

      // Validate targetChainId is provided and different from source chain
      if (!options.targetChainId) {
        throw new Error("targetChainId is required for proof generation");
      }

      if (Number(options.targetChainId) === srcChainId) {
        throw new Error(
          "Target chain ID must be different from source chain ID"
        );
      }

      logger.log("Transaction details:", {
        srcChainId,
        targetChainId: options.targetChainId,
        blockNumber,
        txIndex,
        transactionHash: this.hash,
      });

      // Set options with defaults from config
      const {
        targetChainId,
        maxAttempts = polymerConfig.maxAttempts,
        interval = polymerConfig.interval,
        returnJob = false,
      } = options;

      // Request the proof
      const jobId = await requestProof(
        polymerConfig,
        srcChainId,
        targetChainId,
        blockNumber,
        txIndex
      );

      logger.log("Proof job created with ID:", jobId);

      if (returnJob) {
        return { jobId, receipt };
      }

      // Poll for proof completion
      return wait(polymerConfig, jobId, maxAttempts, interval);
    };
  }

  // Extend TransactionReceipt prototype for ethers v6
  if (
    ethers.TransactionReceipt &&
    !ethers.TransactionReceipt.prototype.polymerProof
  ) {
    /**
     * Request and retrieve a Polymer proof for this transaction receipt
     *
     * @param {Object} options - Options for proof generation
     * @param {number} options.targetChainId - Target chain ID (required, must be different from source)
     * @param {number} [options.maxAttempts] - Maximum polling attempts
     * @param {number} [options.interval] - Polling interval in ms
     * @param {boolean} [options.returnJob] - If true, returns the job object instead of the proof
     * @returns {Promise<string|Object>} The proof as a hex string or the job object
     */
    ethers.TransactionReceipt.prototype.polymerProof = async function (
      options = {}
    ) {
      // Get chainId from the provider
      const provider = this.provider;
      if (!provider) {
        throw new Error("Provider not available in transaction receipt");
      }

      const network = await provider.getNetwork();
      const chainId = network.chainId;
      if (!chainId) {
        throw new Error("Chain ID not found in provider");
      }

      // Extract parameters for Polymer API
      const srcChainId = Number(chainId);
      const blockNumber = this.blockNumber;
      const txIndex = this.index;

      // Validate targetChainId is provided and different from source chain
      if (!options.targetChainId) {
        throw new Error("targetChainId is required for proof generation");
      }

      if (Number(options.targetChainId) === srcChainId) {
        throw new Error(
          "Target chain ID must be different from source chain ID"
        );
      }

      logger.log("Transaction receipt details:", {
        srcChainId,
        targetChainId: options.targetChainId,
        blockNumber,
        txIndex,
        transactionHash: this.hash,
      });

      // Set options with defaults from config
      const {
        targetChainId,
        maxAttempts = polymerConfig.maxAttempts,
        interval = polymerConfig.interval,
        returnJob = false,
      } = options;

      // Request the proof
      const jobId = await requestProof(
        polymerConfig,
        srcChainId,
        targetChainId,
        blockNumber,
        txIndex
      );

      logger.log("Proof job created with ID:", jobId);

      if (returnJob) {
        return { jobId, receipt: this };
      }

      // Poll for proof completion
      return wait(polymerConfig, jobId, maxAttempts, interval);
    };
  }

  /**
   * Get the Polymer proof job status
   *
   * @param {string} jobId - The Polymer proof job ID
   * @returns {Promise<Object>} The job status
   */
  ethers.TransactionResponse.prototype.polymerProofStatus = async function (
    jobId
  ) {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    return queryProofStatus(polymerConfig, jobId);
  };

  /**
   * Get the Polymer proof job status
   *
   * @param {string} jobId - The Polymer proof job ID
   * @returns {Promise<Object>} The job status
   */
  ethers.TransactionReceipt.prototype.polymerProofStatus = async function (
    jobId
  ) {
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    return queryProofStatus(polymerConfig, jobId);
  };

  // Add standalone functions to the ethers object for direct use
  ethers.polymer = {
    /**
     * Request a proof for a transaction
     *
     * @param {Object} params - Parameters for proof generation
     * @param {number} params.chainId - Chain ID
     * @param {number} params.blockNumber - Block number
     * @param {number} params.txIndex - Transaction index
     * @param {number} [params.targetChainId] - Target chain ID (if different from source)
     * @returns {Promise<string>} Job ID for the proof request
     */
    requestProof: async (params) => {
      const { chainId, blockNumber, txIndex, targetChainId } = params;
      return requestProof(
        polymerConfig,
        chainId,
        targetChainId,
        blockNumber,
        txIndex
      );
    },

    /**
     * Query the status of a proof generation job
     *
     * @param {string} jobId - Job ID from the proof request
     * @returns {Promise<Object>} The job status
     */
    queryProofStatus: (jobId) => {
      return queryProofStatus(polymerConfig, jobId);
    },

    /**
     * Poll for proof completion
     *
     * @param {string} jobId - Job ID from the proof request
     * @param {number} [maxAttempts] - Maximum polling attempts
     * @param {number} [interval] - Polling interval in ms
     * @returns {Promise<Object>} The proof result
     */
    wait: (jobId, maxAttempts, interval) => {
      return wait(
        polymerConfig,
        jobId,
        maxAttempts || polymerConfig.maxAttempts,
        interval || polymerConfig.interval
      );
    },
  };
}

/**
 * Request a Polymer proof for a transaction
 *
 * @param {Object} config - Polymer configuration
 * @param {number} srcChainId - Source chain ID
 * @param {number} targetChainId - Target chain ID (optional)
 * @param {number} blockNumber - Block number
 * @param {number} txIndex - Transaction index
 * @returns {Promise<string>} Job ID for the proof request
 */
async function requestProof(
  config,
  srcChainId,
  targetChainId,
  blockNumber,
  txIndex
) {
  const method = "receipt_requestProof";
  const params = targetChainId
    ? [srcChainId, targetChainId, blockNumber, txIndex]
    : [srcChainId, blockNumber, txIndex];

  const logger = createLogger(config.debug);
  logger.log("Requesting proof with params:", params);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Polymer API error: ${JSON.stringify(data.error)}`);
    }

    return data.result;
  } catch (error) {
    logger.error("Error requesting proof:", error);
    throw error;
  }
}

/**
 * Query the status of a proof generation job
 *
 * @param {Object} config - Polymer configuration
 * @param {string} jobId - Job ID from the proof request
 * @returns {Promise<Object>} The job status
 */
async function queryProofStatus(config, jobId) {
  const logger = createLogger(config.debug);
  logger.log("Querying proof status for job:", jobId);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "receipt_queryProof",
        params: [jobId],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Polymer API error: ${JSON.stringify(data.error)}`);
    }

    return data.result;
  } catch (error) {
    logger.error("Error querying proof status:", error);
    throw error;
  }
}

/**
 * Poll for proof completion
 *
 * @param {Object} config - Polymer configuration
 * @param {string} jobId - Job ID from the proof request
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} interval - Polling interval in ms
 * @returns {Promise<Object>} The proof result
 */
async function wait(config, jobId, maxAttempts, interval) {
  const logger = createLogger(config.debug);
  logger.log(
    `Polling for proof completion (max ${maxAttempts} attempts, interval ${interval}ms)`
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.log(`Polling attempt ${attempt}/${maxAttempts}`);

    const result = await queryProofStatus(config, jobId);

    if (result.status === "complete") {
      logger.log("Proof generation complete!");
      return result;
    }

    if (result.status === "error") {
      throw new Error(
        `Proof generation failed: ${result.failureReason || "Unknown error"}`
      );
    }

    if (attempt < maxAttempts) {
      logger.log(`Waiting ${interval}ms before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(`Proof generation timed out after ${maxAttempts} attempts`);
}

/**
 * Create a logger instance for debugging
 *
 * @param {boolean} enabled - Whether logging is enabled
 * @returns {Object} Logger object
 */
function createLogger(enabled = false) {
  return {
    log: (...args) => {
      if (enabled) {
        console.log("[Polymer Ethers]", ...args);
      }
    },
    error: (...args) => {
      if (enabled) {
        console.error("[Polymer Ethers]", ...args);
      }
    },
  };
}

// Export for browser and Node.js environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { addPolymerToEthers };
} else {
  // Browser export
  window.addPolymerToEthers = addPolymerToEthers;
}
