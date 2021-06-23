// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./FaucetStorage.sol";


contract FaucetProxy is FaucetStorage {

    address upgradeAdmin;
    address public faucetAddress;

    constructor(address _initial, address _upgradeAdmin) {
        faucetAddress = _initial;
        upgradeAdmin = _upgradeAdmin;
    }

    function upgradeFaucet(address _newFaucet) public {
        require(msg.sender == upgradeAdmin, "FREEMOON: Invalid address attempting upgrade.");
        faucetAddress = _newFaucet;
    }

    fallback() external {
        address implementation = faucetAddress;
        require(faucetAddress != address(0));
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