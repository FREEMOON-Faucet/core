// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorageV2.sol";


contract AirdropProxyV2 is AirdropStorageV2 {

    address upgradeAdmin;
    address public currentAirdrop;

    constructor(address _initial) {
        upgradeAdmin = msg.sender;
        currentAirdrop = _initial;
    }

    function upgradeAirdrop(address _newAirdrop) public {
        require(msg.sender == upgradeAdmin, "FREEMOON: Invalid address attempting upgrade.");
        currentAirdrop = _newAirdrop;
    }

    fallback() external payable {
        address implementation = currentAirdrop;
        require(currentAirdrop != address(0));
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

    receive() external payable {
        require(msg.sender == upgradeAdmin, "FREEMOON: Restricted");
    }
}