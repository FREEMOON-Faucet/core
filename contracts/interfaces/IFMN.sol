// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


interface IFMN {
    function rewardWinner(address _account, uint8 _lottery) external;
}