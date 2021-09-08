// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../interfaces/IFREE.sol";
import "../interfaces/IFaucet.sol";
import "../FRC758/interfaces/IFRC758.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract AirdropStorageV2 {

    IFREE free;
    IFaucet faucet;

    // EOA's
    address public admin;
    address public coordinator;
    address public governance;

    // Initialized values
    bool initialized; // Constructor
    bool paramsInitialized; // Airdrop amount, airdrop cooldown

    bool airdropAssetsInitialized; // Airdrop assets (non FRC758)
    bool mintingAssetsInitialized; // Minting assets (FRC758)
    bool symbolsInitialized; // Token symbols

    // Configurable parameters
    uint256 public airdropAmount;
    uint256 public airdropCooldown;

    // Lists of airdrop assets and minting assets
    address[] public airdropAssets;
    address[] public mintingAssets;

    mapping(string => bool) public isPaused;

    // The numbers associated with each feature, usually inverse of one another
    mapping(address => uint256) public balanceRequired;
    mapping(address => uint256) public dailyMintReward;

    // The current end date for the timeframe specified.
    mapping(Timeframe => uint256) public termEnd;

    // The balance locked in this position.
    mapping(bytes32 => uint256) public positionBalance;

    mapping(address => string) public assetSymbol;

    mapping(address => uint256) public previousClaim;

    mapping(string => uint256) public _uintStorage;
    mapping(string => address) public _addressStorage;
    mapping(string => bool) public _boolStorage;
    mapping(string => bytes32) public _bytes32Storage;

    enum Timeframe {
        Short,
        Medium,
        Long
    }

    /**
     * @notice Emitted when someone claims their owed FREE airdrop.
     *
     * @param recipient The receiver of the FREE airdrop.
     * @param amount The amount of FREE airdropped.
     */
    event Airdrop(address indexed recipient, uint256 amount);
}