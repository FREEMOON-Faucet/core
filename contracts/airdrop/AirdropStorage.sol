// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../interfaces/IFREE.sol";
import "../interfaces/IFaucet.sol";


contract AirdropStorage {

    IFREE public free;
    IFaucet public faucet;

    address public admin;
    address public coordinator;
    address public governance;

    bool initialized;
    bool assetsInitialized;

    // Configurable parameters
    uint256 public airdropAmount;
    uint256 public airdropCooldown;

    uint256 public lastAirdrop;

    mapping(string => bool) public isPaused;

    mapping(address => uint256) public balRequiredFor;

    address[] public eligibleAssets;

    event Airdrop(uint256 minted, uint256 recipients);
}