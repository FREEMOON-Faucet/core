// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


contract Balance {
    function getBalance(address _account) public view returns(uint256) {
        return _account.balance;
    }
}


