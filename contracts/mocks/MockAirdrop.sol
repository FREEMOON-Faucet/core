// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


contract MockAirdrop {

    address[] public subscribers;

    function addSubscriber(address _subscriber) external {
        subscribers.push(_subscriber);
    }
}