// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorage.sol";


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
     * @param _airdropAmount The amount of FREE given to each recipient in each airdrop.
     * @param _airdropCooldown The time in seconds between each airdrop.
     */
    function initialize(
        address _admin,
        address _coordinator,
        address _governance,
        address _faucet,
        uint256 _airdropAmount,
        uint256 _airdropCooldown
    ) public {
        require(!initialized, "FREEMOON: Airdrop contract can only be initialized once.");
        admin = _admin;
        coordinator = _coordinator;
        governance = _governance;
        faucet = _faucet;
        airdropAmount = _airdropAmount;
        airdropCooldown = _airdropCooldown;
        initialized = true;
    }

    /**
     * @notice Used to set FREE token contract address, only callable once, by admin.
     *
     * @param _free The address of the FREE token.
     *
     * @dev As the FREE token requires the airdrop contract's address to deploy, its address is set after deployment.
     */
    function setAssets(address _free) public onlyAdmin {
        require(!assetsInitialized, "FREEMOON: Assets can only ever be set once.");
        free = IFREE(_free);
        assetsInitialized = true;
    }

    function airdrop() public {
        require(msg.sender == coordinator, "FREEMOON: Only coordinator can initiate airdrops.");
        require(block.timestamp >= lastAirdrop + airdropCooldown, "FREEMOON: Airdrop has already taken place recently.");
        address[] memory subscribers = IFaucet(faucet).airdropTo();
        for(uint8 i = 0; i < subscribers.length; i++) {
            // Check balance of FSN, CHNG, ANY, FUSE/FSN
            IFaucet(faucet).mint(subscribers[i], airdropAmount);
        }
    }
}