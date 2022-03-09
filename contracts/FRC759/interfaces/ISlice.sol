// SPDX-License-Identifier: ChaingeFinance
pragma solidity ^0.8.12;

interface ISlice {
    event Transfer(address indexed sender, address indexed recipient, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function startTime() external view returns(uint256); 
    function endTime() external view returns(uint256); 
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    function initialize(string memory name, string memory symbol, uint8 decimals, uint256 start, uint256 end) external;
    function approveByParent(address owner, address spender, uint256 amount) external returns (bool);
    function transferByParent(address sender, address recipient, uint256 amount) external returns (bool);
}