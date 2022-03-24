/*
*   Simple file to be used to log events in the blockchain
*
*/

import Web3 from 'web3';

const web3 = new Web3(YOUR_RPC_ENDPOINT);
const ABI = YOUR_ABI;
const CONTRACT_ADDRESS = YOUR_CONTRACT_ADDRESS;
const WALLET_ADDRESS = SEND_FROM_ADDRESS;

const EventLog = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

const entryTypes = {
    LOG_OK : "success",
    LOG_ERROR : "error"
}
const entryLog = {
    SUCCESS_WRITE : "system ok write",
    SUCCESS_END : "system shutdown",
    ERROR_WRITE: "error writing file",
    CLIENT_LOGIN: "client login success"
}

// log some events from the app
let log1 = await EventLog.methods.log(Date.now(), Web3.utils.asciiToHex(entryTypes.LOG_OK), Web3.utils.asciiToHex(entryLog.CLIENT_LOGIN)).send({from:WALLET_ADDRESS});
let log2 = await EventLog.methods.log(Date.now(), Web3.utils.asciiToHex(entryTypes.LOG_ERROR), Web3.utils.asciiToHex(entryLog.ERROR_WRITE)).send({from:WALLET_ADDRESS});
let log3 = await EventLog.methods.log(Date.now(), Web3.utils.asciiToHex(entryTypes.LOG_OK), Web3.utils.asciiToHex(entryLog.SUCCESS_END)).send({from:WALLET_ADDRESS});

console.log(log1,log2,log3);
