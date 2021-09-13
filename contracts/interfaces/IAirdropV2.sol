// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

enum Timeframe {
  Short,
  Medium,
  Long
}

interface IAirdropV2 {
    function stake(address _asset, uint256 _amount) external;
    function unstake(address _asset, uint256 _amount) external;
    function harvest(address _asset) external;
    function lock(address _asset, uint256 _amount, Timeframe _timeframe) external;
    function unlock(address _asset, uint256 _amount, Timeframe _timeframe) external;
    function getFarmRewards(address _account, address _asset) external view returns(uint256 rewards);
    function getMintRewards(address _asset, uint256 _amount, uint256 _timestamp) external view returns(uint256 rewards);
    function freeToFmn(uint256 _freeAmount) external view returns(uint256 fmnCost);
    function getPositionId(address _owner, address _asset, uint256 _termEnd) external pure returns(bytes32);
    function farmingAssetCount() external view returns(uint256);
    function mintingAssetCount() external view returns(uint256);
    function farmRewardPerSec(address _asset) external view returns(uint256);
    function mintRewardPerSec(address _asset) external view returns(uint256);
    function termEnd(Timeframe _timeframe) external view returns(uint256);
    function positionBalance(bytes32 _posId) external view returns(uint256);
    function farmBalance(address _account, address _asset) external view returns(uint256);
    function lastModification(address _account, address _asset) external view returns(uint256);
    function assetSymbol(address _asset) external view returns(string memory);
}
