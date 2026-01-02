// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventLog
 * @author Andrei Besleaga Nicolae
 * @notice A smart contract for remote data logging on blockchain
 * @dev Uses OpenZeppelin's Pausable and Ownable for security
 */
contract EventLog is Pausable, Ownable {
    
    /// @notice Emitted when a log entry is created
    /// @param sender Address of the sender
    /// @param userTimestamp User-provided timestamp (application-level event time)
    /// @param blockTimestamp Blockchain timestamp (block.timestamp for verification)
    /// @param logEntryType Type/category of the log entry
    /// @param logEntryMsg Log message content
    event LogEntry(
        address indexed sender,
        uint256 indexed userTimestamp,
        uint256 blockTimestamp,
        bytes8 indexed logEntryType,
        bytes32 logEntryMsg
    );

    /// @notice Emitted when the contract is paused
    event ContractPaused(address indexed by);
    
    /// @notice Emitted when the contract is unpaused
    event ContractUnpaused(address indexed by);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Pause the contract (only owner)
     * @dev Uses OpenZeppelin's Pausable
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @notice Unpause the contract (only owner)
     * @dev Uses OpenZeppelin's Pausable
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @notice Log an event to the blockchain
     * @dev Stores both user-provided timestamp (application time) and block.timestamp (blockchain time)
     * @param userTimestamp User-provided timestamp representing when the event occurred in their system
     * @param logEntryType Type/category of log (max 8 bytes)
     * @param logEntryMsg Log message (max 32 bytes)
     */
    function log(uint256 userTimestamp, bytes8 logEntryType, bytes32 logEntryMsg) 
        external 
        whenNotPaused 
    {
        require(userTimestamp > 0, "EventLog: timestamp cannot be zero");
        require(logEntryType != bytes8(0), "EventLog: type cannot be empty");
        require(logEntryMsg != bytes32(0), "EventLog: message cannot be empty");
        
        emit LogEntry(msg.sender, userTimestamp, block.timestamp, logEntryType, logEntryMsg);
    }
}