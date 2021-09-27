// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorage.sol";

/**
 * @title FREE Token Airdrops
 *
 * @author @paddyc1
 *
 * @notice Subscribers of the FREEMOON Faucet can claim airdrops of FREE once everyday.
 * @notice The amount of FREE received on airdrop is based on the subscriber's balance of certain tokens.
 */
contract Airdrop is AirdropStorage {

    modifier isNotPaused(string memory _feature) {
        require(!isPaused[_feature], "FREEMOON: This function is currently paused.");
        _;
    }
    
    /**
     * @notice On deployment, the relevant addresses are set.
     *
     * @param _admin The admin address, used to deploy and maintain the contract.
     * @param _governance The governance address, used to vote for updating the contract and its parameters.
     * @param _faucet The faucet contract address, required to access the list of subscribers.
     * @param _free The FREE token contract address.
     */
    function initialize(
        address _admin,
        address _governance,
        address _faucet,
        address _free
    ) public {
        require(!initialized, "FREEMOON: Airdrop contract can only be initialized once.");
        admin = _admin;
        governance = _governance;
        faucet = IFaucet(_faucet);
        free = IFREE(_free);
        initialized = true;
    }

    /**
     * @notice Adds new asset balances eligible for a FREE airdrop, or changes existing ones.
     *
     * @param _assets The addresses of the tokens to be added as eligible.
     * @param _balances The balances of these tokens required to receive the FREE airdrop.
     */
    function setAssets(address[] memory _assets, uint256[] memory _balances) public {
        require(msg.sender == governance || (msg.sender == admin && !assetsInitialized), "FREEMOON: Only the governance address can set assets after initialization.");

        for(uint8 i = 0; i < _assets.length; i++) {
            require(_balances[i] != 0, "FREEMOON: Cannot set balance required for an asset to zero.");
            if(balanceRequired[_assets[i]] == 0) {
                airdropAssetCount++;
            }
            balanceRequired[_assets[i]] = _balances[i];
            airdropAssets.push(_assets[i]);
        }

        assetsInitialized = true;
    }

    /**
     * @notice Removes an asset from the list of eligible airdrop assets.
     *
     * @param _asset The address of the asset to remove.
     */
    function removeAsset(address _asset) public {
        require(msg.sender == governance, "FREEMOON: Only the governance address can remove assets.");

        for(uint8 i = 0; i < airdropAssetCount; i++) {
            if(_asset == airdropAssets[i]) {
                airdropAssets[i] = airdropAssets[airdropAssetCount - 1];
                airdropAssets.pop();
                airdropAssetCount = uint8(airdropAssets.length);
                break;
            }
        }
    }

    function fixAirdropList(address[] memory _resetList) public {
        require(msg.sender == admin, "Only admin");
        airdropAssets = _resetList;
        airdropAssetCount = uint8(airdropAssets.length);
    }

    /**
     * @notice Subscribed addresses can claim their airdrop once every set cooldown time.
     * @notice The amount is based on their balance of eligible assets.
     */
    function claimAirdrop() public isNotPaused("claimAirdrop") {
        require(faucet.checkIsSubscribed(msg.sender), "FREEMOON: Only faucet subscribers can claim airdrops.");
        require(previousClaim[msg.sender] + airdropCooldown <= block.timestamp, "FREEMOON: This address has claimed airdrop recently.");
        
        uint256 airdropClaimable;
        for(uint8 i = 0; i < airdropAssetCount; i++) {
            airdropClaimable += getClaimable(msg.sender, airdropAssets[i]);
        }

        if(airdropClaimable > 0) {
            previousClaim[msg.sender] = block.timestamp;
            free.mint(msg.sender, airdropClaimable);
            emit Airdrop(msg.sender, airdropClaimable);
        }
    }
    
    /**
     * @notice Update the parameters around which the faucet operates. Only possible from governance vote.
     *
     * @param _admin The deployer address.
     * @param _airdropAmount The amount of FREE given to each recipient in each airdrop.
     * @param _airdropCooldown The time in seconds between each airdrop.
     */
    function updateParams(address _admin, uint256 _airdropAmount, uint256 _airdropCooldown) public {
        require(msg.sender == governance || (msg.sender == admin && !paramsInitialized), "FREEMOON: Only the governance address can perform this operation.");
        admin = _admin;
        airdropAmount = _airdropAmount;
        airdropCooldown = _airdropCooldown;

        paramsInitialized = true;
    }

    /**
     * @notice Pause specific features of the contract in case of an emergency.
     *
     * @param _pause Whether the intention is to "pause" or "unpause" the specified functions.
     * @param _toSet The list of functions that will be affected by this action.
     */
    function setPause(bool _pause, string[] memory _toSet) public {
        require(msg.sender == admin, "FREEMOON: Only the admin address can perform this operation.");
        for(uint8 i = 0; i < _toSet.length; i++) {
            if(isPaused[_toSet[i]] != _pause) {
                isPaused[_toSet[i]] = _pause;
            } else {
                continue;
            }
        }
    }

    /**
     * @notice Calculates the amount of FREE currently claimable by an address.
     *
     * @param _by The address being checked.
     * @param _asset The asset to check.
     */
    function getClaimable(address _by, address _asset) public view returns(uint256) {
        uint256 freeOwed;
        uint256 bal;
        uint256 netFree;

        if(block.timestamp <= previousClaim[_by] + airdropCooldown) {
            return 0;
        }

        bal = IERC20(_asset).balanceOf(_by);

        if(bal >= balanceRequired[_asset]) {
            uint256 remainder = bal % balanceRequired[_asset];
            bal -= remainder;
            netFree = bal / balanceRequired[_asset];
            freeOwed = netFree * airdropAmount;
        }

        return freeOwed;
    }
}
