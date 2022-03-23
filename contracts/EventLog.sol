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

    event logEntry(
        address indexed sender,
        uint256 indexed logTimestamp,
        bytes8 indexed logEntryType,
        bytes32 logEntryMsg
    );

    function log( uint256 logTimestamp, bytes8 logEntryType, bytes32 logEntryMsg ) public returns(string memory) {
        emit logEntry(msg.sender, logTimestamp, logEntryType, logEntryMsg);
        // return string(abi.encodePacked(msg.sender, logTimestamp, logEntryType, logEntryMsg));
        return 'ok';
    }

}