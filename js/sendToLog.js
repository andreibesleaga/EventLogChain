/*
 *   Simple file to be used to log events in the blockchain
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
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!CONTRACT_ADDRESS) {
    console.error('ERROR: EVENT_LOG_CONTRACT_ADDRESS not set in .env file');
    process.exit(1);
}

if (!WALLET_ADDRESS || !WALLET_PRIVATE_KEY) {
    console.error('ERROR: WALLET_ADDRESS and WALLET_PRIVATE_KEY must be set in .env file');
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

const entryTypes = {
    LOG_OK: "success",
    LOG_ERROR: "error",
    LOG_INFO: "info",
    LOG_WARNING: "warning"
};

const entryLog = {
    SUCCESS_WRITE: "system ok write",
    SUCCESS_END: "system shutdown",
    ERROR_WRITE: "error writing file",
    CLIENT_LOGIN: "client login success",
    CLIENT_LOGOUT: "client logout",
    DATA_SYNC: "data synchronized"
};

async function sendLogs() {
    try {
        const web3 = new Web3(RPC_ENDPOINT);
        const EventLog = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

        // Add account to wallet for signing transactions
        web3.eth.accounts.wallet.add(WALLET_PRIVATE_KEY);

        console.log('Sending log entries to blockchain...\n');

        // Log some events from the app
        console.log('Logging client login...');
        const tx1 = await EventLog.methods.log(
            Math.floor(Date.now() / 1000),
            web3.utils.utf8ToHex(entryTypes.LOG_OK).padEnd(18, '0'),
            web3.utils.utf8ToHex(entryLog.CLIENT_LOGIN).padEnd(66, '0')
        ).send({ from: WALLET_ADDRESS, gas: 100000 });
        console.log(`✓ Transaction hash: ${tx1.transactionHash}`);

        console.log('\nLogging error write...');
        const tx2 = await EventLog.methods.log(
            Math.floor(Date.now() / 1000),
            web3.utils.utf8ToHex(entryTypes.LOG_ERROR).padEnd(18, '0'),
            web3.utils.utf8ToHex(entryLog.ERROR_WRITE).padEnd(66, '0')
        ).send({ from: WALLET_ADDRESS, gas: 100000 });
        console.log(`✓ Transaction hash: ${tx2.transactionHash}`);

        console.log('\nLogging system shutdown...');
        const tx3 = await EventLog.methods.log(
            Math.floor(Date.now() / 1000),
            web3.utils.utf8ToHex(entryTypes.LOG_OK).padEnd(18, '0'),
            web3.utils.utf8ToHex(entryLog.SUCCESS_END).padEnd(66, '0')
        ).send({ from: WALLET_ADDRESS, gas: 100000 });
        console.log(`✓ Transaction hash: ${tx3.transactionHash}`);

        console.log('\n✓ All log entries successfully sent to blockchain!');
        console.log('\nGas used:');
        console.log(`  Log 1: ${tx1.gasUsed} gas`);
        console.log(`  Log 2: ${tx2.gasUsed} gas`);
        console.log(`  Log 3: ${tx3.gasUsed} gas`);
        console.log(`  Total: ${BigInt(tx1.gasUsed) + BigInt(tx2.gasUsed) + BigInt(tx3.gasUsed)} gas`);

    } catch (error) {
        console.error('Error sending logs:', error.message);
        process.exit(1);
    }
}

// Run the function
sendLogs();
