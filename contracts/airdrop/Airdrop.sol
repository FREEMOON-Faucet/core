// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Airdrop is AirdropStorage {

    modifier isNotPaused(string memory _feature) {
        require(!isPaused[_feature], "FREEMOON: This function is currently paused.");
        _;
    }

    modifier onlyGov {
        require(msg.sender == governance, "FREEMOON: Only the governance address can perform this operation.");
        _;
    }

    modifier onlyAdmin {
        require(msg.sender == admin, "FREEMOON: Only the admin address can perform this operation.");
        _;
    }
    
    /**
     * @notice On deployment, the initial airdrop parameters are set.
     * @notice The coordinator address is set in order to manage the daily airdrops.
     *
     * @param _admin The admin address, used to deploy and maintain the contract.
     * @param _coordinator The coordinator address, used to manage the recurring airdrops.
     * @param _governance The governance address, used to vote for updating the contract and its parameters.
     * @param _faucet The faucet contract address, required to access the list of subscribers.
     * @param _free The FREE token contract address.
     * @param _airdropAmount The amount of FREE given to each recipient in each airdrop.
     * @param _airdropCooldown The time in seconds between each airdrop.
     */
    function initialize(
        address _admin,
        address _coordinator,
        address _governance,
        address _faucet,
        address _free,
        uint256 _airdropAmount,
        uint256 _airdropCooldown
    ) public {
        require(!initialized, "FREEMOON: Airdrop contract can only be initialized once.");
        admin = _admin;
        coordinator = _coordinator;
        governance = _governance;
        faucet = IFaucet(_faucet);
        free = IFREE(_free);
        airdropAmount = _airdropAmount;
        airdropCooldown = _airdropCooldown;
        initialized = true;
    }

    /**
     * @notice Adds new asset balances eligible for a FREE airdrop, or changes existing ones.
     *
     * @param _assets The addresses of the tokens to be added as eligible.
     * @param _balRequired The balances of these tokens required to receive the FREE airdrop.
     */
    function setAssets(address[] memory _assets, uint256[] memory _balRequired) public {
        require(msg.sender == governance || !assetsInitialized, "FREEMOON: Only the governance address can set assets after initialization.");
        for(uint8 i = 0; i < _assets.length; i++) {
            balRequiredFor[_assets[i]] = _balRequired[i];
            eligibleAssets.push(_assets[i]);
        }
        assetsInitialized = true;
    }

    /**
     * @notice Subscribed addresses can claim their airdrop once every set cooldown period. The amount is based on their balance of eligible assets.
     *
     * @param _recipient The address to claim their airdrop.
     */
    function claimAirdrop(address _recipient) public {
        require(faucet.isSubscribed(_recipient), "FREEMOON: Only faucet subscribers can claim airdrops.");
        require(previousClaim[_recipient] + airdropCooldown <= block.timestamp, "FREEMOON: This address has claimed airdrop recently.");
        uint256 airdropClaimable = getClaimable(_recipient);
        if(airdropClaimable > 0) {
            previousClaim[_recipient] = block.timestamp;
            free.mint(_recipient, airdropClaimable);
        }
    }

    /**
     * @notice Calculates the amount of FREE currently claimable by an address.
     *
     * @param _by The address being checked.
     */
    function getClaimable(address _by) public view returns(uint256) {
        uint256 freeOwed;

        for(uint8 i = 0; i < eligibleAssets.length; i++) {
            uint256 bal;
            if(eligibleAssets[i] == FSN_ADDRESS) {
                bal = _by.balance;
            } else {
                bal = IERC20(eligibleAssets[i]).balanceOf(_by);
            }
            if(bal >= balRequiredFor[eligibleAssets[i]]) {
                uint256 balRemaining = bal;
                uint256 payments = 0;

                while(balRemaining >= balRequiredFor[eligibleAssets[i]]) {
                    payments++;
                    balRemaining -= balRequiredFor[eligibleAssets[i]];
                }

                freeOwed += payments * airdropAmount;
            }
        }

        return freeOwed;
    }    
}