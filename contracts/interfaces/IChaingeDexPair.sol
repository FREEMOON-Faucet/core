// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


interface IChaingeDexPair {
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);
}