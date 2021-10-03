// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./FRC758/interfaces/IFRC758.sol";


contract TimeframeInteraction {
    uint256 endDate = 1633305600; // tomorrow at 00:00
    uint256 locked = 0;
    IFRC758 token;

    constructor(address _tokenAddr) {
        token = IFRC758(_tokenAddr);
    }

    // Lock in slice (block.timestamp => end time A)
    function lockIn(uint256 _amount) public {
        locked += _amount;
        token.timeSliceTransferFrom(msg.sender, address(this), _amount, block.timestamp, endDate);
    }

    // Lock out same exact slice (block.timestamp => end time A)
    function lockOut() public {
        uint256 current = locked;
        locked = 0;
        token.timeSliceTransferFrom(address(this), msg.sender, current, block.timestamp, endDate);
    }
}