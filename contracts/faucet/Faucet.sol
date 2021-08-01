// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./FaucetStorage.sol";

/**
 * @title The FREEMOON Faucet
 *
 * @author @paddyc1
 *
 * @notice The FREEMOON Faucet enables FSN addresses to subscribe, giving them the ability to claim periodic FREE tokens.
 * @notice With every claim, the address gets entered into a lottery to win a rare FMN token.
 * @notice The odds of winning this lottery are determined by FREE balance, more FREE merits increased odds of winning. 
 */
contract Faucet is FaucetStorage {

    modifier isNotPaused(string memory _feature) {
        require(!isPaused[_feature], "FREEMOON: This function is currently paused.");
        _;
    }
    
    /**
     * @notice On deployment, the initial faucet parameters are set.
     * @notice The FREE & FMN token addresses are initialized.
     * @notice The list of FREE balances required to be elligible for each category is initialized here, along with the odds of winning for each category.
     *
     * @param _admin The admin address, used to deploy and maintain the contract.
     * @param _governance The governance address, used to vote for updating the contract and its parameters.
     * @param _free The address of the FREE token.
     * @param _fmn The address of the FMN token.
     * @param _categories A list of the balances required to qualify for each category.
     * @param _odds A list of odds of winning for each balance category.
     */
    function initialize(
        address _admin,
        address _governance,
        address _free,
        address _fmn,
        uint256[] memory _categories,
        uint256[] memory _odds
    ) public
    {
        require(!initialized, "FREEMOON: Faucet contract can only be initialized once.");
        admin = _admin;
        governance = _governance;

        free = IFREE(_free);
        fmn = IFMN(_fmn);

        for(uint8 ii = 0; ii < _categories.length; ii++) {
            categories[ii] = _categories[ii];
            odds[ii] = _odds[ii];
        }
        initialized = true;
    }

    /**
     * @notice Subscribes the given address. All FREE and FMN claimed with this address goes to its base address. Cost is in FSN.
     *
     * @param _account The address to subscribe.
     */
    function subscribe(address _account) public payable isNotPaused("subscribe") {
        require(msg.value == subscriptionCost, "FREEMOON: Invalid FSN amount sent for subscription cost.");
        require(!isSubscribed[_account], "FREEMOON: Given address is already subscribed.");
        isSubscribed[_account] = true;
        subscribedFor[_account] = msg.sender;
        subscribers++;
        if(coordinator.balance < hotWalletLimit) {
            payable(coordinator).transfer(msg.value);
        }
    }

    /**
     * @notice Claims FREE for a given address and enters them into the FMN draw.
     *
     * @param _claimant The address to claim for. They must be subscribed to the faucet.
     */
    function claim(address _claimant) public isNotPaused("claim") {
        require(isSubscribed[_claimant], "FREEMOON: Only subscribed addresses can claim FREE.");
        require(previousEntry[_claimant] + cooldownTime <= block.timestamp, "FREEMOON: You must wait for your cooldown to end before claiming again.");

        uint8 lottery = getCategory(_claimant);
        previousEntry[_claimant] = block.timestamp;
        claims++;
        claimsSinceLastWin++;

        if(payoutStatus[_claimant] + 1 >= payoutThreshold) {
            payoutStatus[_claimant] = 0;
            free.mint(subscribedFor[_claimant], payoutAmount);
        } else {
            payoutStatus[_claimant]++;
        }

        emit Entry(_claimant, subscribedFor[_claimant], lottery);
    }

    /**
     * @notice Checks if the account won the lottery and if so, mints them a FREEMOON token.
     *
     * @param _account The account which owns the entry.
     * @param _lottery The lottery category the account is taking part in.
     * @param _tx The transaction hash of their entry.
     * @param _block The block hash of their entry.
     *
     * @dev Each time an "Entry" event is emitted, the parameters of the event get fed back into this function to check for a win.
     */
    function resolveEntry(address _account, uint8 _lottery, bytes32 _tx, bytes32 _block) public {
        require(msg.sender == coordinator, "FREEMOON: Only coordinator can resolve entries.");
        bool win = checkIfWin(_lottery, _tx ,_block);
        if(win) {
            _updateOdds();
            winners++;
            uint256 claimsTaken = claimsSinceLastWin;
            claimsSinceLastWin = 0;
            fmn.rewardWinner(subscribedFor[_account], _lottery);
            emit Win(_account, subscribedFor[_account], _lottery, _tx, _block, claimsTaken);
        } else {
          emit Loss(_account, subscribedFor[_account], _lottery, _tx, _block);
        }
    }

    /**
     * @notice Withdraws an amount of FSN subscription funds to another address. Only possible from governance vote.
     *
     * @param _to The address to receive FSN funds.
     * @param _amount The amount of FSN to withdraw from the contract.
     */
    function withdrawFunds(address payable _to, uint256 _amount) public {
        require(msg.sender == governance, "FREEMOON: Only the governance address can perform this operation.");
        require(_amount <= address(this).balance, "FREEMOON: Insufficient FSN funds.");
        payable(_to).transfer(_amount);
    }
    
    /**
     * @notice Update the parameters around which the faucet operates. Only possible from governance vote.
     *
     * @param _coordinator The address of the faucet coordinator.
     * @param _subscriptionCost The cost of subscribing in FSN.
     * @param _cooldownTime The time in seconds an address has to wait before entering the FREEMOON draw again.
     * @param _payoutThreshold The number of times an address has to enter the FREEMOON draw before they get their FREE payout.
     * @param _payoutAmount The current amount of FREE payed to addresses who claim.
     */
    function updateParams(address _admin, address _coordinator, uint256 _subscriptionCost, uint256 _cooldownTime, uint256 _payoutThreshold, uint256 _payoutAmount, uint256 _hotWalletLimit) public {
        require(msg.sender == governance || (msg.sender == admin && !paramsInitialized), "FREEMOON: Only the governance address can perform this operation.");
        admin = _admin;
        coordinator = _coordinator;
        subscriptionCost = _subscriptionCost;
        cooldownTime = _cooldownTime;
        payoutThreshold = _payoutThreshold;
        payoutAmount = _payoutAmount;
        hotWalletLimit = _hotWalletLimit;
        
        paramsInitialized = true;
    }

    /**
     * @notice Pause specific features of the contract in case of an emergency.
     *
     * @param _pause Whether the intention is to "pause" or "unpause" the specified functions.
     * @param _toSet The list of functions that will be affected by this action.
     */
    function setPause(bool _pause, string[] memory _toSet) public {
        require(msg.sender == admin, "FREEMOON: Only the admin address can perform this operation.");
        for(uint8 i = 0; i < _toSet.length; i++) {
            if(isPaused[_toSet[i]] != _pause) {
                isPaused[_toSet[i]] = _pause;
            } else {
                continue;
            }
        }
    }

    /**
     * @notice Checks if the given transaction hash and block hash won the given lottery category.
     *
     * @param _lottery The lottery category being entered, this determines the odds of winning.
     * @param _tx The transaction hash which will determine the random number.
     * @param _block The block hash, which will determine the random number.
     */
    function checkIfWin(uint8 _lottery, bytes32 _tx, bytes32 _block) public view returns(bool) {
        if(odds[_lottery] == 0) {
            return false;
        } else {
            uint256 maxWinAmount = MAX_UINT256 / odds[_lottery];
            uint256 entryValue = uint256(keccak256(abi.encodePacked(_lottery, _tx, _block)));
            return bool(entryValue <= maxWinAmount);
        }
    }

    /**
     * @notice Gets the category determining the given account's odds of success, this is determined by their FREE balance.
     *
     * @param _account The address to check.
     */
    function getCategory(address _account) public view returns(uint8) {
        uint256 bal = free.balanceOf(_account);
        uint8 lottery;

        for(uint8 ii = 0; ii < CATEGORIES; ii++) {
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
        return payoutStatus[_account] >= payoutThreshold;
    }

    /**
     * @notice Every time a FMN token is won, the chances of winning one are globally reduced by 10%.
     */
    function _updateOdds() private {
        for(uint8 i = 0; i < CATEGORIES; i++) {
            if(odds[i] == 0) {
                continue;
            } else {
                odds[i] += odds[i] / 10;
            }
        }
    }
}
