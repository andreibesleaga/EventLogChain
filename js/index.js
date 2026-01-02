/*
 *   Simple file to be used to query the past log events in the blockchain
 *   Updated for web3@4.x with environment configuration
 */

import { Web3 } from 'web3';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = process.env.EVENT_LOG_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
    console.error('ERROR: EVENT_LOG_CONTRACT_ADDRESS not set in .env file');
    console.error('Please set EVENT_LOG_CONTRACT_ADDRESS after deploying the contract');
    process.exit(1);
}

// Load contract ABI
let ABI;
try {
    const buildPath = join(__dirname, '../build/contracts/EventLog.json');
    const contractJSON = JSON.parse(readFileSync(buildPath, 'utf8'));
    ABI = contractJSON.abi;
} catch (error) {
    console.error('ERROR: Could not load contract ABI from build/contracts/EventLog.json');
    console.error('Please compile the contracts first: npm run compile');
    process.exit(1);
}

async function getPastLogs() {
    try {
        const web3 = new Web3(RPC_ENDPOINT);
        const EventLog = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

        // filters
        const options = {
            filter: {
                //entryType: [1]    // filter by entryType
            },
            fromBlock: 0, // number || "earliest" || "pending" || "latest"
            //toBlock: 'latest'
        };

        console.log('Fetching past LogEntry events...');
        const events = await EventLog.getPastEvents('LogEntry', options);

        console.log(`\nFound ${events.length} log entries:\n`);

        events.forEach((event, index) => {
            const { sender, userTimestamp, blockTimestamp, logEntryType, logEntryMsg } = event.returnValues;

            console.log(`Event #${index + 1}:`);
            console.log(`  Sender: ${sender}`);
            console.log(`  User Timestamp: ${userTimestamp} (${new Date(parseInt(userTimestamp) * 1000).toISOString()})`);
            console.log(`  Block Timestamp: ${blockTimestamp} (${new Date(parseInt(blockTimestamp) * 1000).toISOString()})`);
            console.log(`  Type: ${web3.utils.hexToUtf8(logEntryType)}`);
            console.log(`  Message: ${web3.utils.hexToUtf8(logEntryMsg)}`);
            console.log(`  Block: ${event.blockNumber}, Transaction: ${event.transactionHash}\n`);
        });

    } catch (error) {
        console.error('Error fetching past events:', error.message);
        process.exit(1);
    }
}

// Run the function
getPastLogs();