// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "../FRC758/FRC758.sol";

/**
 * @title The FREEMOON Token contract
 *
 * @author @paddyc1
 *
 * @notice FREEMOON is an FRC758 standard token.
 */
contract FMNOlder is FRC758 {

    uint256 immutable TO_WEI;
    uint256 constant INITIAL_SUPPLY = 10;
    uint256 constant LIMIT = 1000;
    uint256 public circulationSupply;
    address public admin;
    address public governance;
    address public faucet;
    bool initialized;
    bool initialMinted;

    /**
     * @notice Emits when someone wins 1 FREEMOON.
     *
     * @param beneficiary The winner of the FREEMOON.
     * @param lottery The ID of the lottery the winner was taking part in. Lottery is determined by FREE balance.
     */
    event Winner(address indexed beneficiary, uint8 indexed lottery);

    /**
     * @notice On deployment, the required addresses are set, and initial supply is minted.
     *
     * @param _name The name of the token, i.e. "The FREEMOON Token".
     * @param _symbol The symbol of the token, i.e. "FREEMOON".
     * @param _decimals The decimals of the token, used for display puposes, i.e. 18.
     * @param _admin The admin address, used to manage deployment.
     * @param _governance The governance address, used to vote for upgrading the faucet address.
     */
    constructor(string memory _name, string memory _symbol, uint256 _decimals, address _admin, address _governance) FRC758(_name, _symbol, _decimals) {
        admin = _admin;
        governance = _governance;
        TO_WEI = 10 ** _decimals;
        circulationSupply += INITIAL_SUPPLY * 10 ** _decimals;
        totalSupply = LIMIT * 10 ** _decimals;
    }

    /**
     * @notice Mint the initial supply of FMN. Can only be called once.
     *
     * @param _receiver The address to receive the initial supply.
     */
    function initialMint(address _receiver) public {
        require(msg.sender == admin && !initialMinted, "FREEMOON: Only admin can call initial mint, once.");
        initialMinted = true;
        uint256 mintAmount = INITIAL_SUPPLY * TO_WEI;
        _mint(_receiver, mintAmount);
    }

    /**
     * @notice Update the address permitted to mint FMN (faucet). Only possible from governance vote.
     *
     * @param _faucet The new address for the faucet contract.
     */
    function setMintInvokers(address _faucet) public {
        require(msg.sender == governance || (msg.sender == admin && !initialized), "FREEMOON: Only governance votes can update the faucet address.");
        faucet = _faucet;
        initialized = true;
    }

    /**
     * @notice When someone wins the FREEMOON lottery, they are rewarded with 1 FMN.
     *
     * @param _winner The winning address to be rewarded.
     * @param _lottery The category of odds the winner won in, based off their balance of FREE.
     */
    function rewardWinner(address _winner, uint8 _lottery) external {
        require(msg.sender == faucet, "FREEMOON: Only faucet has minting privileges.");
        require((circulationSupply + 1 * TO_WEI) <= totalSupply, "FREEMOON: Cannot mint more tokens.");

        circulationSupply += 1 * TO_WEI;
        _mint(_winner, 1 * TO_WEI);
        emit Winner(_winner, _lottery);
    }

    /**
     * @notice Burns FREEMOON from sender's balance.
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