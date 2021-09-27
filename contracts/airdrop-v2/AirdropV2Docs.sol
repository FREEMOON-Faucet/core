// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorageV2.sol";

/**
 * @title FREE Token Airdrops
 *
 * @author @paddyc1
 *
 * @notice Subscribers of the FREEMOON Faucet can claim airdrops of FREE once everyday.
 * @notice The amount of FREE received on airdrop is based on the subscriber's balance of certain tokens.
 */
abstract contract AirdropV2Docs is AirdropStorageV2 {

    // modifier isNotPaused(string memory _feature) virtual;

    /**
     * @notice On deployment, the relevant addresses are set.
     *
     * @param _admin The admin address, used to deploy and maintain the contract.
     * @param _governance The governance address, used to vote for updating the contract and its parameters.
     * @param _faucet The faucet contract address, required to access the list of subscribers.
     * @param _free The FREE token contract address.
     * @param _fmn The FMN token contract address.
     */
    function initialize(address _admin, address _governance, address _faucet, address _free, address _fmn) public virtual;

    /**
     * @notice Adds new assets for FREE farms, or changes existing ones.
     *
     * @param _assets The addresses of the tokens to be used for a farm.
     * @param _rewards The farming reward per second for this token's farm.
     */
    function setFarmingAssets(address[] memory _assets, uint256[] memory _rewards) public virtual;

    /**
     * @notice Adds new assets eligible for FREE minting, or changes existing ones.
     *
     * @param _assets The addresses of the tokens to be added as eligible.
     * @param _rewards The mintable FREE per second locked for these tokens.
     */
    function setMintingAssets(address[] memory _assets, uint256[] memory _rewards) public virtual;

    /**
     * @notice Update the symbol for an airdrop token, for display purposes.
     *
     * @param _assets The address of the tokens whose symbols are being updated.
     * @param _symbols The symbols of these tokens to be updated.
     */
    function setSymbols(address[] memory _assets, string[] memory _symbols) public virtual;

    /**
     * @notice Removes an address from the list of farms.
     *
     * @param _asset The address of the farm token to remove.
     */
    function removeFarmAsset(address _asset) public virtual;

    /**
     * @notice Removes an address from the list of timelock tokens.
     *
     * @param _asset The address of the token to remove.
     */
    function removeMintAsset(address _asset) public virtual;

    // Governance function to reset list of farm assets.
    function resetFarmingList(address[] memory _resetList) public virtual;

    // Governance function to reset list of mint assets.
    function resetMintingList(address[] memory _resetList) public virtual;

    /**
     * @notice Stake tokens on a farm. Earn more FREE the longer the tokens are staked.
     *
     * @param _asset The address of the token to stake in the farm.
     * @param _amount The amount of this token to stake on the farm.
     */
    function stake(address _asset, uint256 _amount) public virtual;

    /**
     * @notice Unstake tokens from a farm.
     *
     * @param _asset The address of the token to unstake from the farm.
     * @param _amount The amount of this token to unstake from the farm.
     */
    function unstake(address _asset, uint256 _amount) public virtual;
    
    /**
     * @notice Harvests the available rewards from a position.
     *
     * @param _asset The token address of this farm.
     */
    function harvest(address _asset) public virtual;

    /**
     * @notice Holders of FRC758 tokens can timelock them in exchange for FREE.
     * @notice The mintable FREE is determined by: (number of locked tokens) * (number of seconds locked).
     *
     * @param _asset The address of the FRC758 token to timelock.
     * @param _amount The amount of this token to timelock.
     * @param _timeframe The term to lock their tokens for. Can be short (<4 months), medium (<8 months) or long (<12 months).
     */
    function mint(address _asset, uint256 _amount, Timeframe _timeframe) public virtual;

    /**
     * @notice Once a position is created with an FRC758 token, an amount locked, and an end date decided, these tokens can also be unlocked.
     * @notice The price of unlocking these tokens is in FMN, equivalent to the value of the position in FREE.
     *
     * @param _asset The address of the FRC758 token to unlock.
     * @param _amount The amount of this token to unlock.
     * @param _timeframe The term of the position to unlock tokens from. The term may have since been moved to a different category, i.e. Short, Medium, or Long.
     */
    function unlock(address _asset, uint256 _amount, Timeframe _timeframe) public virtual;

    /**
     * @notice Governance can introduce a new timeframe for minting, that ends one year from the time of introduction.
     *
     * @param _timestamp The timestamp of the end of the new Long term.
     */
    function newTerm(uint256 _timestamp) public virtual;

    /**
     * @notice Pause specific features of the contract in case of an emergency.
     *
     * @param _pause Whether the intention is to "pause" or "unpause" the specified functions.
     * @param _toSet The list of functions that will be affected by this action.
     */
    function setPause(bool _pause, string[] memory _toSet) public virtual;

    /**
     * @notice Returns the FREE rewards accumulated by this position.
     *
     * @param _account The account who owns this position.
     * @param _asset The token address associated with this position.
     *
     * @return The amount of FREE that can be harvested in this position.
     */
    function getFarmRewards(address _account, address _asset) public virtual view returns(uint256);

    /**
     * @notice Calculates the amount of FREE that can be minted from this position.
     *
     * @param _asset The token address associated with this position.
     * @param _amount The amount of this token locked in this position.
     * @param _timestamp The timestamp at which the tokens are unlocked from this position.
     *
     * @return The amount of FREE that can be minted from this position.
     */
    function getMintRewards(address _asset, uint256 _amount, uint256 _timestamp) public virtual view returns(uint256);

    function getPositionId(address _owner, address _asset, uint256 _termEnd) public virtual pure returns(uint256);

    function farmingAssetCount() public virtual view returns(uint256);

    function mintingAssetCount() public virtual view returns(uint256);
}
