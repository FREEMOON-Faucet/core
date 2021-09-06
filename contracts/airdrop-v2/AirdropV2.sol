// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorageV2.sol";

/**
 * @title FREE Token Airdrops
 *
 * @author @paddyc1
 *
 * @notice Subscribers of the FREEMOON Faucet can claim airdrops of FREE once everyday.
 * @notice The amount of FREE received on airdrop is based on the subscriber's balance of certain tokens.
 */
contract AirdropV2 is AirdropStorageV2 {

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
    function setAirdropAssets(address[] memory _assets, uint256[] memory _balances) public {
        require(
          msg.sender == governance || (msg.sender == admin && !airdropAssetsInitialized),
          "FREEMOON: Only the governance address can set assets after initialization."
        );

        for(uint8 i = 0; i < _assets.length; i++) {
            require(_balances[i] != 0, "FREEMOON: Cannot set balance required for an asset to zero.");
            if(balanceRequired[_assets[i]] == 0) {
                airdropAssetCount++;
                airdropAssets.push(_assets[i]);
            }
            balanceRequired[_assets[i]] = _balances[i];
        }

        airdropAssetsInitialized = true;
    }

    /**
     * @notice Adds new assets eligible for FREE minting, or changes existing ones.
     *
     * @param _assets The addresses of the tokens to be added as eligible.
     * @param _rewards The daily mintable FREE for these tokens.
     */
    function setMintingAssets(address[] memory _assets, uint256[] memory _rewards) public {
        require(
          msg.sender == governance || (msg.sender == admin && !mintingAssetsInitialized),
          "FREEMOON: Only the governance address can set assets after initialization."
        );

        for(uint8 i = 0; i < _assets.length; i++) {
            require(_rewards[i] != 0, "FREEMOON: Cannot set daily mint reward for an asset to zero.");
            if(dailyMintReward[_assets[i]] == 0) {
                mintingAssetCount++;
                mintingAssets.push(_assets[i]);
            }
            dailyMintReward[_assets[i]] = _rewards[i];
        }
        
        mintingAssetsInitialized = true;
    }

    /**
     * @notice Update the symbol for an airdrop token, for display purposes.
     *
     * @param _assets The address of the tokens whose symbols are being updated.
     * @param _symbols The symbols of these tokens to be updated.
     */
    function setSymbols(address[] memory _assets, string[] memory _symbols) public {
        require(
          msg.sender == governance || (msg.sender == admin && !symbolsInitialized), 
          "FREEMOON: Only the governance address can set symbols after initialization."
        );

        for(uint8 i = 0; i < _assets.length; i++) {
            assetSymbol[_assets[i]] = _symbols[i];
        }

        symbolsInitialized = true;
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
            if(_asset == mintingAssets[i]) {
              mintingAssets[i] = mintingAssets[mintingAssetCount - 1];
              mintingAssets.pop();
              mintingAssetCount = uint8(mintingAssets.length);
              break;
            }
        }
    }

    function resetAirdropList(address[] memory _resetList) public {
        require(msg.sender == admin, "Only admin");
        airdropAssets = _resetList;
        airdropAssetCount = uint8(_resetList.length);
    }

    function resetMintingList(address[] memory _resetList) public {
        require(msg.sender == admin, "Only admin.");
        mintingAssets = _resetList;
        mintingAssetCount = uint8(_resetList.length);
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

    function mint(address _asset, uint256 _amount, Timeframe timeframe) public {
        require(dailyMintReward[_asset] > 0, "FREEMOON: This token is not an accepted FREE minter.");
        require(termEnd[timeframe] > 0, "FREEMOON: This term is not yet valid.");
        require(termEnd[timeframe] - block.timestamp > 86400, "Cannot time slice for less than one day.");

        bytes32 positionId = getPositionId(msg.sender, _asset, termEnd[timeframe]);

        positionBalance[positionId] += _amount;

        IFRC758(_asset).timeSliceTransferFrom(msg.sender, address(this), _amount, block.timestamp, termEnd[timeframe]);
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

    function updateTerms(uint256 _shortTerm, uint256 _mediumTerm, uint256 _longTerm) public {
        require(
            msg.sender == governance || (msg.sender == admin && !termsInitialized),
            "FREEMOON: Only the governance address can set symbols after initialization."
        );

        termEnd[Timeframe.Short] = _shortTerm;
        termEnd[Timeframe.Medium] = _mediumTerm;
        termEnd[Timeframe.Long] = _longTerm;

        termsInitialized = true;
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

    function getPositionId(address _owner, address _asset, uint256 _termEnd) public pure returns(bytes32) {
        return bytes32(abi.encodePacked(_owner, _asset, _termEnd));
    }
}
