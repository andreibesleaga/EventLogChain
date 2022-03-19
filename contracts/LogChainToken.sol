// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/*
* @title Solidity EventLogChain
* @author Andrei Besleaga Nicolae
* @date 2022
* @notice A simple smart contract for a new ERC20 token to be used in the EventLogChain
*
*/

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract LogChainToken is ERC20 {

    string public _name = "LogChainToken";
    string public _symbol = "LOGC";
    uint8 public _decimals = 2;
    uint public INITIAL_SUPPLY = 1000000000000; // 1000 billions

    constructor() ERC20(_name, _symbol) {
        _mint(msg.sender, INITIAL_SUPPLY * (10 ** decimals()));
    }

}
