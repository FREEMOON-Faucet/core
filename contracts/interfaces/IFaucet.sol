// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


interface IFaucet {
    function mint(address _account, uint256 _amount) external;
    function airdropTo() external view returns(address[] memory);
}