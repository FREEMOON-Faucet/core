// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;


contract FSNContract {
    address constant precompile = address(0x9999999999999999999999999999999999999999);

    event LogFusionAssetReceived(bytes32 indexed _asset, address indexed _from, uint256 _value, uint64 _start, uint64 _end, SendAssetFlag _flag);
    event LogFusionAssetSent(bytes32 indexed _asset, address indexed _to, uint256 _value, uint64 _start, uint64 _end, SendAssetFlag _flag);

    enum SendAssetFlag {
        UseAny,                                       // 0
        UseAnyToTimeLock,              // 1
        UseTimeLock,                           // 2
        UseTimeLockToTimeLock,  // 3
        UseAsset,                                    // 4
        UseAssetToTimeLock            // 5
    }

    function _sendAsset(bytes32 asset, address to, uint256 value, uint64 start, uint64 end, SendAssetFlag flag) internal returns(bool, bytes memory) {
        bytes memory input = abi.encode(1, asset, to, value, start, end, flag);
        return precompile.call(input);
    }
    
    function _receiveAsset(bytes32 assetID, uint64 startTime, uint64 endTime, SendAssetFlag flag, uint256[] memory extraInfo) payable public returns(bool success) {
        return true;
    }

    /// For testing only
    function end() public {
      selfdestruct(payable(msg.sender));
    }
}