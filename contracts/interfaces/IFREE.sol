// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../FRC758/interfaces/IFRC758.sol";


interface IFREE is IFRC758 {
    function mint(address _account, uint256 _amount) external;
    function balanceOf(address _account) external view returns(uint256);
    function transfer(address _recipient, uint256 _amount) external returns(bool);
}