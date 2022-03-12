// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.12;

import "../FRC759/FRC759.sol";


contract MockFRC759 is FRC759 {
    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply, uint256 _maxSupply)
      FRC759(_name, _symbol, _decimals, _maxSupply)
    {
      // _mint(msg.sender, _initialSupply);
    }
}