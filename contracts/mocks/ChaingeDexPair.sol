// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


contract ChaingeDexPair {

    uint112 constant reserve0 = 8756475190032563780053036;
    uint112 constant reserve1 = 825055366669035542;


    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = uint32(block.timestamp);
    }
}