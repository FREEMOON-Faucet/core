// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.5;

import "./FRC758/FRC758.sol";


contract MockFRC758 is FRC758 {

    uint256 public circulationSupply;
    uint256 constant LIMIT = 1000000000;


    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) FRC758(_name, _symbol, 18) {
        circulationSupply += _initialSupply * 10 ** 18;
        totalSupply = LIMIT * 10 ** 18;
        _mint(msg.sender, _initialSupply);
    }

    function transfer(address _recipient, uint256 _amount) public returns(bool) {
        transferFrom(msg.sender, _recipient, _amount);
        return true;
    }

    function balanceOf(address _account) public view returns(uint256) {
        return timeBalanceOf(_account, block.timestamp, MAX_TIME) + balance[_account];
    }
}