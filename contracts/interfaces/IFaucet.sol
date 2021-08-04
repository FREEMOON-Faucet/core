// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


interface IFaucet {
    function checkIsSubscribed(address _account) external view returns(bool);
}