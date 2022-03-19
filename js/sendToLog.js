/*
*   Simple file to be used to query the past log events in the blockchain
*
*/

import Web3 from 'web3';


const web3 = new Web3(YOUR_RPC_ENDPOINT);
const ABI = YOUR_ABI;
const CONTRACT_ADDRESS = YOUR_CONTRACT_ADDRESS;

const EventLog = new Web3.Contract(ABI, CONTRACT_ADDRESS);

const entryTypes = {
    LOG_OK : 1,
    LOG_ERROR : 2
}
const entryLog = {
    SUCCESS_WRITE : 1,
    SUCCESS_END :2,
    ERROR_WRITE:3,
    CLIENT_LOGIN:4
}

EventLog.methods.log(Date.now(), entryTypes.LOG_OK, entryLog.CLIENT_LOGIN).send();
