/*
*   Simple file to be used to query the past log events in the blockchain
*
*/

import Web3 from 'web3';


const web3 = new Web3(YOUR_RPC_ENDPOINT);

const ABI = YOUR_ABI;
const CONTRACT_ADDRESS = YOUR_CONTRACT_ADDRESS;

const EventLog = new Web3.Contract(ABI, CONTRACT_ADDRESS);

// filters
let options = {
    filter: {
        entryType: [1]    // filter by entryType
    },
    fromBlock: 0, // number || "earliest" || "pending" || "latest"
    toBlock: 'latest'
};

EventLog.getPastEvents('logs', options)
    .then(results => console.log(results))
    .catch(err => { throw err});


// alternative way
// EventLog.logs({}, { fromBlock: 0, toBlock: 'latest' }).get((error, eventResult) => {
//     if (error)
//         console.log('Error in myEvent event handler: ' + error);
//     else
//         console.log('myEvent: ' + JSON.stringify(eventResult.args));
// });