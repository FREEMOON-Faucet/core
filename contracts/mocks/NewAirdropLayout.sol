// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../airdrop/Airdrop.sol";


contract NewAirdropLayout is Airdrop {
    function setAddress(string memory _name, address _val) public {
        _addressStorage[_name] = _val;
    }

    function getAddress(string memory _name) public view returns(address) {
        return _addressStorage[_name];
    }
}