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
    
    address constant FSN_ADDRESS = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    bool initialized;
    bool assetsInitialized;
    bool paramsInitialized;

    // Configurable parameters
    uint256 public airdropAmount;
    uint256 public airdropCooldown;

    uint256 public lastAirdrop;

    mapping(string => bool) public isPaused;

    mapping(address => uint256) public balRequiredFor;
    mapping(address => uint256) public airdropOwed;
    mapping(address => uint256) public previousClaim;

    address[] public eligibleAssets;
    uint256 public assetCount;

    mapping(string => uint256) _uintStorage;
    mapping(string => address) _addressStorage;
    mapping(string => bool) _boolStorage;
    

    event Airdrop(address indexed recipient, uint256 amount);
}