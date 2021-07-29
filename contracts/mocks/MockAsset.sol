// SPDX-Licence-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockAsset is ERC20 {
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) ERC20(_name, _symbol) {
        _mint(msg.sender, _initialSupply);
    }
}