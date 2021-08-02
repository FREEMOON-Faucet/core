// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../faucet/Faucet.sol";


contract NewFaucetLayout is Faucet {
    function setUint(string memory _name, uint256 _val) public {
        _uintStorage[_name] = _val;
    }

    function getUint(string memory _name) public view returns(uint256) {
        return _uintStorage[_name];
    }
}