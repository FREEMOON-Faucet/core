// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

/**
 * @notice This is mock contract designed only to test the randomness of the FREEMOON lottery.
 */
contract LotteryFaucet {

    address coordinator;

    uint256 constant MAX_UINT256 = 2 ** 256 - 1;

    mapping(uint8 => uint256) public odds;

    modifier onlyCoordinator {
        require(msg.sender == coordinator, "FREEMOON: Only coordinator can call this function.");
        _;
    }

    constructor(address _coordinator, uint256[] memory _odds) {
        coordinator = _coordinator;
        for(uint8 i = 0; i < 8; i++) {
            odds[i] = _odds[i];
        }
    }
    
    function checkWin(uint8 _lottery, bytes32 _tx, bytes32 _block) public view onlyCoordinator returns(bool) {
        if(odds[_lottery] == 0) {
            return false;
        } else {
            uint256 maxWinAmount = MAX_UINT256 / odds[_lottery];
            uint256 entryValue = uint256(keccak256(abi.encodePacked(_lottery, _tx, _block)));
            if(entryValue <= maxWinAmount) {
                return true;
            } else {
                return false;
            }
        }
    }
    
}