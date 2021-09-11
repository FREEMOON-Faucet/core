// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


interface IFMN {
    function rewardWinner(address _winner, uint8 _lottery) external;
    function balanceOf(address _account) external view returns(uint256);
    function transfer(address _recipient, uint256 _amount) external returns(bool);
    function transferFrom(address _from, address _to, uint256 amount) external returns(bool);
}