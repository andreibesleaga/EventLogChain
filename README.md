# EventLogChain
Ethereum Blockchain Remote Events Logger

( work in progress ) 

Simple experimental lib / examples, to log small remote data (event timestamp/type/message) to ethereum blockchain, per client sender

- Includes smartcontracts with log mechanism (events emitting) to be deployed on a ethereum blockchain network
- Incudes custom ERC20 token - crypto currency token (LOGC)
- Includes web3 javascript example code to interact remotely with EventLogChain smartcontracts (read/write/search/subscribe event data in blockchain logs)
- Includes php example code to interact with the EventLogChain smartcontracts (read/write/search messages in blockchain logs)

contracts (to be deployed on blockchain) : 
    - EventLog.sol - log events
    - LogChainToken.sol - token implementation (extending openzeppelin ERC20)
    - Migration.sol - truffle helpers

js (to be used on backend/frontend web3 apps remotely to interact with the blockchain functions) :
    - index.js - to read from event logs
    - sendToLog.js - to write to logs
    - subscribe.js - subscribe to be notified by any changes in the logs when a new log event

php (to be used on backend web3 php projects) :
    - to be done

truffle.config : config is using a local dev environment with truffle//ganache and infura//tests networks
migrations : truffle migrations files for deployment of contracts on different networks
test : automated truffle solidity/js tests
