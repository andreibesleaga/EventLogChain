/*
 *   Simple file to be used to subscribe and monitor the log events 
 *   (when they are triggered in the blockchain by the contract method)
 *   Updated for web3@4.x with WebSocket support
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

// Use WebSocket endpoint for subscriptions
const WS_ENDPOINT = process.env.WS_ENDPOINT || 'ws://127.0.0.1:7545';
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

async function subscribeToLogs() {
    try {
        const web3 = new Web3(WS_ENDPOINT);
        const EventLog = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

        console.log('Subscribing to LogEntry events...');
        console.log(`Contract address: ${CONTRACT_ADDRESS}`);
        console.log('Waiting for new log entries...\n');

        // Subscribe to LogEntry events
        const subscription = EventLog.events.LogEntry({
            fromBlock: 'latest',
            //address: ['0x...'], // filter from specific sender addresses logs
            //logEntryType: [],    // filter only by entryType set by logger
        });

        subscription.on('connected', (subscriptionId) => {
            console.log(`✓ Subscription ID: ${subscriptionId}\n`);
        });

        subscription.on('data', (event) => {
            const { sender, userTimestamp, blockTimestamp, logEntryType, logEntryMsg } = event.returnValues;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔔 New Log Entry Detected!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`  Sender: ${sender}`);
            console.log(`  User Timestamp: ${userTimestamp} (${new Date(parseInt(userTimestamp) * 1000).toISOString()})`);
            console.log(`  Block Timestamp: ${blockTimestamp} (${new Date(parseInt(blockTimestamp) * 1000).toISOString()})`);
            console.log(`  Type: ${web3.utils.hexToUtf8(logEntryType)}`);
            console.log(`  Message: ${web3.utils.hexToUtf8(logEntryMsg)}`);
            console.log(`  Block: ${event.blockNumber}`);
            console.log(`  Transaction: ${event.transactionHash}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

        subscription.on('changed', (event) => {
            console.log('⚠️ Event changed (reorganization):', event);
        });

        subscription.on('error', (error) => {
            console.error('❌ Subscription error:', error.message);
            process.exit(1);
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\nShutting down subscription...');
            subscription.unsubscribe((error, success) => {
                if (success) {
                    console.log('✓ Successfully unsubscribed');
                }
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Error subscribing to events:', error.message);
        process.exit(1);
    }
}

// Run the subscription
subscribeToLogs();
