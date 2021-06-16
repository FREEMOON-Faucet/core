// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../FRC758/interfaces/IFRC758.sol";


interface IFREE is IFRC758 {
    function mint(address _account, uint256 _amount) external;
    function balanceOf(address _account) external view returns(uint256);
    function transfer(address _recipient, uint256 _amount) external returns(bool);
    function clean(address _account, uint256 _tokenStart, uint256 _tokenEnd) external;
    function onTimeSlicedTokenReceived(address _operator, address _from, uint256 amount, uint256 newTokenStart, uint256 newTokenEnd) external pure returns(bytes4);
}