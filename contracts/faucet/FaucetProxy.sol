// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./FaucetStorage.sol";


contract FaucetProxy is FaucetStorage {

    address upgradeAdmin;
    address public currentFaucet;

    constructor(address _initial) {
        upgradeAdmin = msg.sender;
        currentFaucet = _initial;
    }

    function upgradeFaucet(address _newFaucet) public {
        require(msg.sender == upgradeAdmin, "FREEMOON: Invalid address attempting upgrade.");
        currentFaucet = _newFaucet;
    }

    fallback() external payable {
        address implementation = currentFaucet;
        require(currentFaucet != address(0));
        bytes memory data = msg.data;

        assembly {
            let result := delegatecall(gas(), implementation, add(data, 0x20), mload(data), 0, 0)
            let size := returndatasize()
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, size)
            switch result
            case 0 {revert(ptr, size)}
            default {return(ptr, size)}
        }
    }
}