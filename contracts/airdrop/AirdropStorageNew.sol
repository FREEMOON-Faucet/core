// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../interfaces/IFREE.sol";
import "../interfaces/IFaucet.sol";


contract AirdropStorageNew {

    IFREE public free;
    IFaucet public faucet;

    address public admin;
    address public coordinator;
    address public governance;
    
    address constant FSN_ADDRESS = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    bool initialized;
    bool assetsInitialized;

    // Configurable parameters
    uint256 public airdropAmount;
    uint256 public airdropCooldown;

    uint256 public lastAirdrop;

    mapping(string => bool) public isPaused;

    mapping(address => uint256) public balRequiredFor;
    mapping(address => uint256) public airdropOwed;

    address[] public eligibleAssets;

    event Airdrop(address indexed recipient, uint256 amount);
}