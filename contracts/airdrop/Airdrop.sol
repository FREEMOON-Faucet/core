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
     * @notice Initiates an airdrop to valid subscribed addresses.
     * @notice This function may be called once per cooldown period, and sends the current set amount of FREE.
     * @notice All subscribers will be checked for the balance required for each eligible token to receive the airdrop.
     */
    function airdrop() public {
        require(block.timestamp >= lastAirdrop + airdropCooldown, "FREEMOON: Airdrop has already taken place recently.");

        for(uint8 i = 0; i < subscribers.length; i++) {
            uint256 freeOwed = 0;

            for(uint8 j = 0; j < eligibleAssets.length; j++) {
                uint256 bal;
                if(eligibleAssets[j] == FSN_ADDRESS) {
                    bal = subscribers[i].balance;
                } else {
                    bal = IERC20(eligibleAssets[j]).balanceOf(subscribers[i]);
                }
                if(bal >= balRequiredFor[eligibleAssets[j]]) {
                    uint256 balRemaining = bal;
                    uint256 payments = 0;

                    while(balRemaining >= balRequiredFor[eligibleAssets[j]]) {
                        payments++;
                        balRemaining -= balRequiredFor[eligibleAssets[j]];
                    }

                    freeOwed += payments * airdropAmount;
                }
            }

            if(freeOwed > 0) {
                free.mint(subscribers[i], freeOwed);
            }
        }

        lastAirdrop = block.timestamp;
    }

    /**
     * @notice Adds a subscriber to the list of airdrop recipients.
     * @notice Only the faucet contract can add new subscribers here.
     *
     * @param _subscriber The address to add as a future airdrop recipient.
     */
    function addSubscriber(address _subscriber) external {
        require(msg.sender == address(faucet), "FREEMOON: Only faucet can add airdrop recipients.");
        subscribers.push(_subscriber);
    }
}