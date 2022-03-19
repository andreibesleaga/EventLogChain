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
        uint256 indexed timestamp,
        bytes32 indexed entryType,
        bytes32 entry
    );

    function log( uint256 timestamp, bytes32 entryType, bytes32 entry ) public returns(string memory) {
        emit logEntry(msg.sender, timestamp, entryType, entry);
        // return string(abi.encodePacked(msg.sender, timestamp, entryType, entry));
        return 'ok';
    }

}