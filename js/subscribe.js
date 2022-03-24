/*
*   Simple file to be used to subscribe and monitor the log events 
*  (when they are triggered in the blockchain by the contract method)
*
*/

import Web3 from 'web3';

const web3 = new Web3(YOUR_RPC_ENDPOINT); // 'ws://127.0.0.1:7545'

//const ABI = YOUR_ABI;
//const CONTRACT_ADDRESS = YOUR_CONTRACT_ADDRESS;
//const EventLog = new Web3.Contract(ABI, CONTRACT_ADDRESS);

// filters
let options = {
    fromBlock: 0,
    //address: ['address-1'], // filter from specific sender addresses logs
    //entryType: [],           // filter only by entryType set by logger
};

let subscription = web3.eth.subscribe('logs', options, (err,event) => {
    if (!err)
    console.log(event)
});

subscription.on('data', event => console.log(event))
subscription.on('changed', changed => console.log(changed))
subscription.on('error', err => { throw err })
subscription.on('connected', nr => console.log(nr))

// alternative
// EventLog.events.logs({}, { fromBlock: 0, toBlock: 'latest' }).on(
//     'data', function(event) {
//     console.log(event);
//   }).on('error', console.error);
