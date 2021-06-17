// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./interfaces/IFREE.sol";
import "./interfaces/IFREEMOON.sol";


contract Faucet {

    IFREE free;
    IFREEMOON freemoon;

    address coordinator;
    address governance;
    bool initialized;

    uint256 constant TO_WEI = 10 ** 18;
    bytes32 constant MAX_VAL = bytes32(uint256(2 ** 256 - 1));

    // Settings
    uint256 public subscriptionCost;
    uint256 public cooldownTime;
    uint256 public payoutThreshold;
    uint256 public payoutAmount;

    mapping(address => bool) public isSubscribed;
    mapping(address => uint256) public previousEntry;
    mapping(address => uint256) public payoutStatus;

    mapping(uint8 => uint256) public categories;
    mapping(uint8 => uint256) public odds;

    /**
     * @notice Emitted whenever an address enters the FREEMOON draw.
     *
     * @param entrant The address entering the FREEMOON draw.
     * @param lottery The category determining the entrant's odds of success, this is determined by their FREE balance.
     *
     * @dev A listener for this event responds by rewarding FREEMOON to the entrant if successful in the lottery category.
     */
    event Entry(address indexed entrant, uint8 indexed lottery);

    modifier onlyCoordinator {
        require(msg.sender == coordinator, "FREEMOON: Only coordinator can call this function.");
        _;
    }
    
    /**
     * @notice On deployment, the initial faucet parameters are set.
     * @notice The coordinator address is set in order to initialize the faucet parameters, and manage the FREEMOON lottery.
     * @notice The list of FREE balances required to be elligible for each category is initialized here, along with the odds of winning for each category.
     *
     * @param _governance The governance address, used to vote for updating the contract and its parameters.
     * @param _subscriptionCost The cost of subscribing in FSN.
     * @param _cooldownTime The time in seconds an address has to wait before entering the FREEMOON draw again.
     * @param _payoutThreshold The number of times an address has to enter the FREEMOON draw before they get their FREE payout.
     * @param _payoutAmount The current amount of FREE payed to addresses who claim.
     * @param _categories A list of the balances required to qualify for each category.
     * @param _odds A list of odds of winning for each balance category.
     */
    constructor(address _governance, uint256 _subscriptionCost, uint256 _cooldownTime, uint256 _payoutThreshold, uint256 _payoutAmount, uint256[] memory _categories, uint256[] memory _odds) {
        coordinator = msg.sender;
        governance = _governance;
        subscriptionCost = _subscriptionCost;
        cooldownTime = _cooldownTime;
        payoutThreshold = _payoutThreshold;
        payoutAmount = _payoutAmount;

        for(uint8 ii = 0; ii < _categories.length; ii++) {
            categories[ii] = _categories[ii];
            odds[ii] = _odds[ii];
        }
    }

    /**
     * @notice Used to set contract addresses, only callable once, by coordinator.
     *
     * @param _free The address of the FREE token.
     * @param _freemoon The address of the FREEMOON token.
     *
     * @dev As the FREE and FREEMOON tokens require the faucet contract's address to deploy, their addresses are set after deployment.
     */
    function initialize(address _free, address _freemoon) public onlyCoordinator {
        require(!initialized, "FREEMOON: Asset addresses can only ever be set once.");
        free = IFREE(_free);
        freemoon = IFREEMOON(_freemoon);
        initialized = true;
    }

    /**
     * @notice Subscribes given address. Cost is in FSN.
     *
     * @param _account The address to subscribe.
     */
    function subscribe(address _account) public payable {
        require(msg.value == subscriptionCost, "FREEMOON: Invalid FSN amount for number of addresses being subscribed.");
        require(!isSubscribed[_account], "FREEMOON: Given address is already subscribed.");
        isSubscribed[_account] = true;
    }

    /**
     * @notice Enters a subscribed address into the FREEMOON draw.
     *
     * @param _entrant The address to enter, they must be subscribed to the faucet.
     */
    function enter(address _entrant) public {
        require(isSubscribed[_entrant], "FREEMOON: Only subscribed addresses can enter the draw.");
        require(previousEntry[_entrant] + cooldownTime <= block.timestamp, "FREEMOON: You must wait for your cooldown to end before entering again.");

        uint8 lottery = getLottery(_entrant);
        previousEntry[_entrant] = block.timestamp;

        if(getPayoutStatus(_entrant)) {
            payoutStatus[_entrant] = 0;
            free.transfer(_entrant, payoutAmount);
        } else {
            payoutStatus[_entrant]++;
        }

        emit Entry(_entrant, lottery);
    }

    function checkWin(uint8 _lottery) public view onlyCoordinator returns(bytes32) {
        bytes32 maxWinAmount = MAX_VAL;
        return maxWinAmount;
    }

    /**
     * @notice Gets the category determining the given account's odds of success, this is determined by their FREE balance.
     *
     * @param _account The address to check.
     */
    function getLottery(address _account) public view returns(uint8) {
        uint256 bal = free.balanceOf(_account);
        uint8 lottery;

        for(uint8 ii = 0; ii <= 7; ii++) {
            if(bal < categories[ii]) {
                lottery = ii;
                break;
            } else {
                continue;
            }
        }

        return lottery;
    }

    /**
     * @notice Checks if a given account has made enough entries (since their last FREE payout) to receive their next FREE payout.
     *
     * @param _account The address to check.
     */
    function getPayoutStatus(address _account) public view returns(bool) {
        return payoutStatus[_account] == payoutThreshold;
    }
}