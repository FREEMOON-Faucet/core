// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../interfaces/IFREE.sol";
import "../interfaces/IFMN.sol";
import "../interfaces/IFaucet.sol";
import "../FRC758/interfaces/IFRC758.sol";
import "../interfaces/IChaingeDexPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract AirdropStorageV2 {

    IFaucet public faucet;
    IFREE public free;
    IFMN public fmn;
    IChaingeDexPair public pool;

    // EOA's
    address public admin;
    address public coordinator;
    address public governance;

    // Initialized values
    bool initialized; // Constructor

    bool farmingAssetsInitialized; // Farm assets (non FRC758)
    bool mintingAssetsInitialized; // Minting assets (FRC758)
    bool symbolsInitialized; // Token symbols

    // Lists of airdrop assets and minting assets
    address[] public farmingAssets;
    address[] public mintingAssets;

    mapping(string => bool) public isPaused;

    // The numbers associated with each feature
    mapping(address => uint256) public farmRewardPerSec;
    mapping(address => uint256) public mintRewardPerSec;

    // The current end date for the timeframe specified.
    mapping(Timeframe => uint256) public termEnd;

    // The balance locked in this position.
    mapping(bytes32 => uint256) public positionBalance;

    // Account => Token => Balance.
    mapping(address => mapping(address => uint256)) public farmBalance;
    // Account => Token => Time Staked.
    mapping(address => mapping(address => uint256)) public lastModification;

    mapping(address => string) public assetSymbol;

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

    /**
     * @notice Emitted when someone either deposits into a farm, or when someone timelocks tokens.
     *
     * @param airdrop Either "farming", or "timelock_mint".
     * @param account The account depositing.
     * @param amount The amount of tokens deposited.
     */
    event Deposit(string airdrop, address indexed account, uint256 amount);

    /**
     * @notice Emitted when someone either withdraws from a farm, or when someone unlocks tokens.
     *
     * @param airdrop Either "farming", or "timelock_mint".
     * @param account The account withdrawing.
     * @param amount The amount of tokens withdrawn.
     */
    event Withdrawal(string airdrop, address indexed account, uint256 amount);
}