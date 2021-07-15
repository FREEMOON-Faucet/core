// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../interfaces/IFREE.sol";


contract AirdropStorage {

    IFREE free;

    address public admin;
    address public coordinator;
    address public governance;

    bool initialized;
    bool assetsInitialized;

    // Configurable parameters
    uint256 public airdropFrequency;

    mapping(address => bool) public isPaused;

    event Airdrop(uint256 minted, uint256 recipients);
}