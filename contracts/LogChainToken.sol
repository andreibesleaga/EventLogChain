// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LogChainToken
 * @author Andrei Besleaga Nicolae
 * @notice ERC20 token for use in the EventLogChain ecosystem
 * @dev Extends OpenZeppelin's ERC20 implementation
 */
contract LogChainToken is ERC20, Ownable {
    uint8 private constant DECIMALS = 2;
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000_000; // 1 trillion (with underscores for readability)

    /**
     * @notice Creates the LogChainToken with initial supply
     * @dev Mints initial supply to deployer
     */
    constructor() ERC20("LogChainToken", "LOGC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY * (10 ** decimals()));
    }

    /**
     * @notice Returns the number of decimals
     * @return Number of decimal places (2)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Allows owner to mint additional tokens if needed
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "LogChainToken: mint to zero address");
        _mint(to, amount);
    }

    /**
     * @notice Allows token holders to burn their tokens
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
