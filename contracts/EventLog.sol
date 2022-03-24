// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/*
* @title Solidity EventLogChain
* @author Andrei Besleaga Nicolae
* @date 2022
* @notice A simple smart contract for remote data logging on blockchain
*
*/

contract EventLog {

    address owner;
    bool isStopped;
    
    event logEntry(
        address indexed sender,
        uint256 indexed logTimestamp,
        bytes8 indexed logEntryType,
        bytes32 logEntryMsg
    );

    constructor() {
        owner = msg.sender;
        isStopped = false;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }    

    modifier isNotStopped {
        require(!isStopped);
        _;
    }    

    function stop() public onlyOwner {
        isStopped = true;
    }

    function restart() public onlyOwner {
        isStopped = false;
    }

    function log( uint256 logTimestamp, bytes8 logEntryType, bytes32 logEntryMsg ) public isNotStopped {
        emit logEntry(msg.sender, logTimestamp, logEntryType, logEntryMsg);
    }

}