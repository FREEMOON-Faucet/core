// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../FRC758/FRC758.sol";

/**
 * @title The FREE Token Contract
 *
 * @author @paddyc1
 *
 * @notice FREE is an FRC758 standard token.
 */
contract FREE is FRC758 {

    uint256 immutable TO_WEI;
    uint256 constant INITIAL_SUPPLY = 100000000; // One Hundred Million
    uint256 constant LIMIT = 100000000000; // One Hundred Billion
    uint256 public circulationSupply = 0;
    address public admin;
    address public governance;
    address public faucet;
    address public airdrop;
    bool initialized;

    /**
     * @notice On deployment, the required addresses are set, and initial supply is minted.
     *
     * @param _name The name of the token, i.e. "The FREE Token".
     * @param _symbol The symbol of the token, i.e. "FREE".
     * @param _decimals The decimals of the token, used for display puposes, i.e. 18.
     * @param _admin The admin address, used to manage deployment.
     * @param _governance The governance address, used to vote for upgrading the airdrop and/or faucet address.
     */
    constructor(string memory _name, string memory _symbol, uint256 _decimals, address _admin, address _governance) FRC758(_name, _symbol, _decimals) {
        admin = _admin;
        governance = _governance;
        TO_WEI = 10 ** _decimals;
        circulationSupply += INITIAL_SUPPLY * 10 ** _decimals;
        totalSupply = LIMIT * 10 ** _decimals;
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** _decimals);
    }

    /**
     * @notice Update the addresses permitted to mint FREE (airdrop and faucet). Only possible from governance vote.
     *
     * @param _faucet The new address for the faucet contract.
     * @param _airdrop The new address for the airdrop contract.
     */
    function setMintInvokers(address _faucet, address _airdrop) public {
        require(msg.sender == governance || (msg.sender == admin && !initialized), "FREEMOON: Only governance votes can update the airdrop and/or the faucet addresses.");
        faucet = _faucet;
        airdrop = _airdrop;
        initialized = true;
    }

    /**
     * @notice Mints FREE to given address. Only faucet contract and airdrop contract can do this.
     *
     * @param _account The receiver of the minted tokens.
     * @param _amount The amount to mint.
     */
    function mint(address _account, uint256 _amount) external {
        require(msg.sender == airdrop || msg.sender == faucet, "FREEMOON: Only faucet and airdrop have minting privileges.");
        require((circulationSupply + _amount) <= totalSupply, "FREEMOON: Cannot mint more tokens.");

        circulationSupply += _amount;
        _mint(_account, _amount);
    }

    /**
     * @notice Burns FREE from sender's balance.
     *
     * @param _amount Amount to burn.
     */
    function burn(uint256 _amount) public {
        circulationSupply -= _amount;
        _burn(msg.sender, _amount);
    }

    /**
     * @notice Burns a time slice of FREE from sender's balance.
     *
     * @param _account Sender's account.
     * @param _amount Amount to burn.
     * @param _tokenStart Start time of slice to be burned.
     * @param _tokenEnd End time of token to be burned.
     */
    function burnTimeSlice(address _account, uint256 _amount, uint256 _tokenStart, uint256 _tokenEnd) public {
        require(msg.sender == _account, "FREEMOON: Only owner of tokens can burn time slices.");
        _burnSlice(_account, _amount, _tokenStart, _tokenEnd);
    }

    function transfer(address _recipient, uint256 _amount) public returns(bool) {
        transferFrom(msg.sender, _recipient, _amount);
        return true;
    }

    function balanceOf(address _account) public view returns(uint256) {
        return timeBalanceOf(_account, block.timestamp, MAX_TIME) + balance[_account];
    }

    function onTimeSlicedTokenReceived(address _operator, address _from, uint256 amount, uint256 newTokenStart, uint256 newTokenEnd) public pure returns(bytes4) {
        _operator = address(0);
        _from = address(0);
        amount = 0;
        newTokenStart = 0;
        newTokenEnd = 0;
        return bytes4(keccak256("onTimeSlicedTokenReceived(address,address,uint256,uint256,uint256)"));
    }

    function clean(address from, uint256 tokenStart, uint256 tokenEnd) public {
        require(msg.sender == from);
        _clean(from, tokenStart, tokenEnd);
    }
}