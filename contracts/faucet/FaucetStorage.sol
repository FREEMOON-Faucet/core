// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../FSNContract.sol";
import "../interfaces/IAirdrop.sol";
import "../interfaces/IFREE.sol";
import "../interfaces/IFREEMOON.sol";


contract FaucetStorage is FSNContract {

    IFREE free;
    IFREEMOON freemoon;
    IAirdrop airdrop;

    address public admin;
    address public coordinator;
    address public governance;

    bool initialized;
    bool assetsInitialized;

    uint8 constant CATEGORIES = 8;
    uint256 constant MAX_UINT256 = 2 ** 256 - 1;
    bytes32 constant FSN_ASSET_ID = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint64 constant FOUR_MONTHS = 3600 * 24 * 30 * 4;

    // Configurable parameters
    uint256 public subscriptionCost;
    uint256 public cooldownTime;
    uint256 public payoutThreshold;
    uint256 public payoutAmount;
    uint256 public hotWalletLimit;

    uint256 public subscribers;
    uint256 public winners;
    uint256 public claims;
    uint256 public claimsSinceLastWin;

    mapping(string => bool) public isPaused;

    mapping(address => bool) public isSubscribed;
    mapping(address => uint256) public previousEntry;
    mapping(address => uint256) public payoutStatus;
    mapping(address => address) public subscribedFor;

    mapping(uint8 => uint256) public categories;
    mapping(uint8 => uint256) public odds;

    /**
     * @notice Emitted whenever an address enters the FREEMOON draw.
     *
     * @param entrant The address entering the FREEMOON draw.
     * @param baseAddress The address who the claimant is entering for.
     * @param lottery The category determining the entrant's odds of success, this is determined by their FREE balance.
     *
     * @dev A listener for this event responds by rewarding FREEMOON to the entrant if successful in the lottery category.
     */
    event Entry(address indexed entrant, address indexed baseAddress, uint8 indexed lottery);

    /**
     * @notice Emitted when an entry wins the lottery and the address is awarded a FREEMOON.
     *
     * @param entrant The address who entered the FREEMOON draw.
     * @param baseAddress The address that entrant is subscribed for.
     * @param lottery The category that the address entered into.
     * @param txHash The transaction hash of the "enter" function call.
     * @param blockHash The block hash of the "enter" function call.
     */
    event Win(address indexed entrant, address indexed baseAddress, uint8 indexed lottery, bytes32 txHash, bytes32 blockHash, uint256 claimsTaken);

    /**
     * @notice Emitted when an entry loses the lottery.
     *
     * @param entrant The address who entered the FREEMOON draw.
     * @param baseAddress The address that entrant is subscribed for.
     * @param lottery The category that the address entered into.
     * @param txHash The transaction hash of the "enter" function call.
     * @param blockHash The block hash of the "enter" function call.
     */
    event Loss(address indexed entrant, address indexed baseAddress, uint8 indexed lottery, bytes32 txHash, bytes32 blockHash);
}
