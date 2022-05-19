
// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;


interface IFRC20 {
    function mint(address _account, uint256 _amount) external;
    function burn(uint256 _amount) external;
    function balanceOf(address _account) external view returns (uint256);
    function transferFrom(address _sender, address _recipient, uint256 _amount) external;
}


contract FreemoonSwap759 {
    address oldFree758;
    address free;
    address oldFmn758;
    address fmn;

    constructor (address _oldFree758, address _free, address _oldFmn758, address _fmn) {
        oldFree758 = _oldFree758;
        free = _free;
        
        oldFmn758 = _oldFmn758;
        fmn = _fmn;
    }

    function oldFreeToFree() public {
        uint256 bal758 = IFRC20(oldFree758).balanceOf(msg.sender);

        if(bal758 > 0) {
            IFRC20(oldFree758).transferFrom(msg.sender, address(this), bal758);
            IFRC20(oldFree758).burn(bal758);
            IFRC20(free).mint(msg.sender, bal758);
        }
    }

    function oldFmnToFmn() public {
        uint256 bal758 = IFRC20(oldFmn758).balanceOf(msg.sender);

        if(bal758 > 0) {
            IFRC20(oldFmn758).transferFrom(msg.sender, address(this), bal758);
            IFRC20(oldFmn758).burn(bal758);
            IFRC20(fmn).mint(msg.sender, bal758);
        }
    }
}
