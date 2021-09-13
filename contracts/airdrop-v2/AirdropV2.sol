// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.5;

import "./AirdropStorageV2.sol";
import "hardhat/console.sol";


contract AirdropV2 is AirdropStorageV2 {

    modifier isNotPaused(string memory _feature) {
        require(!isPaused[_feature], "FREEMOON: This function is currently paused.");
        _;
    }

    function initialize(address _admin, address _governance, address _faucet, address _free, address _fmn, address _pool) public {
        require(!initialized, "FREEMOON: Airdrop contract can only be initialized once.");

        admin = _admin;
        governance = _governance;
        faucet = IFaucet(_faucet);
        free = IFREE(_free);
        fmn = IFMN(_fmn);
        pool = IChaingeDexPair(_pool);

        initialized = true;
    }

    function setFarmingAssets(address[] memory _assets, uint256[] memory _rewards) public {
        require(
          msg.sender == governance || (msg.sender == admin && !farmingAssetsInitialized),
          "FREEMOON: Only the governance address can set assets after initialization."
        );

        for(uint8 i = 0; i < _assets.length; i++) {
            require(_rewards[i] != 0, "FREEMOON: Cannot set rewards for an asset to zero.");
            if(farmRewardPerSec[_assets[i]] == 0) {
                farmingAssets.push(_assets[i]);
            }
            farmRewardPerSec[_assets[i]] = _rewards[i];
        }

        farmingAssetsInitialized = true;
    }

    function setMintingAssets(address[] memory _assets, uint256[] memory _rewards) public {
        require(
          msg.sender == governance || (msg.sender == admin && !mintingAssetsInitialized),
          "FREEMOON: Only the governance address can set assets after initialization."
        );

        for(uint8 i = 0; i < _assets.length; i++) {
            require(_rewards[i] != 0, "FREEMOON: Cannot set rewards for an asset to zero.");
            if(mintRewardPerSec[_assets[i]] == 0) {
                mintingAssets.push(_assets[i]);
            }
            mintRewardPerSec[_assets[i]] = _rewards[i];
        }
        
        mintingAssetsInitialized = true;
    }

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

    function removeFarmAsset(address _asset) public {
        require(msg.sender == governance, "FREEMOON: Only the governance address can remove assets.");

        for(uint8 i = 0; i < farmingAssets.length; i++) {
            if(_asset == farmingAssets[i]) {
                farmingAssets[i] = farmingAssets[farmingAssets.length - 1];
                farmingAssets.pop();
                break;
            }
        }
    }

    function removeMintAsset(address _asset) public {
        require(msg.sender == governance, "FREEMOON: Only the governance address can remove assets.");

        for(uint8 i = 0; i < mintingAssets.length; i++) {
          if(_asset == mintingAssets[i]) {
              mintingAssets[i] = mintingAssets[mintingAssets.length - 1];
              mintingAssets.pop();
              break;
            }
        }
    }

    function resetFarmingList(address[] memory _resetList) public {
        require(msg.sender == governance, "Only governance.");
        farmingAssets = _resetList;
    }

    function resetMintingList(address[] memory _resetList) public {
        require(msg.sender == governance, "Only governance.");
        mintingAssets = _resetList;
    }

    function stake(address _asset, uint256 _amount) public isNotPaused("stake") {
        require(faucet.checkIsSubscribed(msg.sender), "FREEMOON: This address is not subscribed to the FREEMOON Faucet.");
        require(farmRewardPerSec[_asset] > 0, "FREEMOON: This token is not an accepted FREE farm.");
        harvest(_asset);
        farmBalance[msg.sender][_asset] += _amount;
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
    }

    function unstake(address _asset, uint256 _amount) public isNotPaused("unstake") {
        require(farmRewardPerSec[_asset] > 0, "FREEMOON: This token is not an accepted FREE farm.");
        require(_amount <= farmBalance[msg.sender][_asset], "FREEMOON: Not enough of this token deposited.");
        harvest(_asset);
        farmBalance[msg.sender][_asset] -= _amount;
        IERC20(_asset).transfer(msg.sender, _amount);
    }

    function harvest(address _asset) public isNotPaused("harvest") {
        require(farmRewardPerSec[_asset] > 0, "FREEMOON: This token is not an accepted FREE farm.");
        uint256 earned = getFarmRewards(msg.sender, _asset);
        lastModification[msg.sender][_asset] = block.timestamp;
        if(earned > 0) {
            free.mint(msg.sender, earned);
        }
    }

    function lock(address _asset, uint256 _amount, Timeframe _timeframe) public isNotPaused("mint") {
        require(faucet.checkIsSubscribed(msg.sender), "FREEMOON: This address is not subscribed to the FREEMOON Faucet.");
        require(mintRewardPerSec[_asset] > 0, "FREEMOON: This token is not an accepted FREE minter.");
        require(termEnd[_timeframe] > 0, "FREEMOON: This term is not yet valid.");
        require(termEnd[_timeframe] - block.timestamp > 86400, "FREEMOON: Cannot time slice for less than one day.");

        bytes32 positionId = getPositionId(msg.sender, _asset, termEnd[_timeframe]);
        uint256 rewards = getMintRewards(_asset, _amount, termEnd[_timeframe]);

        positionBalance[positionId] += _amount;

        IFRC758(_asset).timeSliceTransferFrom(msg.sender, address(this), _amount, block.timestamp, termEnd[_timeframe]);
        free.mint(msg.sender, rewards);
    }

    function unlock(address _asset, uint256 _amount, Timeframe _timeframe) public isNotPaused("unlock") {
        require(mintRewardPerSec[_asset] > 0, "FREEMOON: This token is not an accepted FREE minter.");
        bytes32 positionId = getPositionId(msg.sender, _asset, termEnd[_timeframe]);
        require(_amount <= positionBalance[positionId], "FREEMOON: Specified amount of tokens is not locked in this position.");

        uint256 rewards = getMintRewards(_asset, _amount, termEnd[_timeframe]);
        uint256 unlockCost = freeToFmn(rewards);

        positionBalance[positionId] -= _amount;

        fmn.transferFrom(msg.sender, governance, unlockCost);
        IFRC758(_asset).timeSliceTransferFrom(address(this), msg.sender, _amount, block.timestamp, termEnd[_timeframe]);
    }

    function newTerm(uint256 _timestamp) public {
        require(msg.sender == governance, "FREEMOON: Only governance can set new terms.");
        
        termEnd[Timeframe.Short] = termEnd[Timeframe.Medium];
        termEnd[Timeframe.Medium] = termEnd[Timeframe.Long];
        termEnd[Timeframe.Long] = _timestamp;
    }

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

    function getFarmRewards(address _account, address _asset) public view returns(uint256 rewards) {
        uint256 sinceLastModification = block.timestamp - lastModification[_account][_asset];
        uint256 earned = farmBalance[_account][_asset] * sinceLastModification * farmRewardPerSec[_asset];
        rewards = earned / 10 ** 18;
    }

    function getMintRewards(address _asset, uint256 _amount, uint256 _timestamp) public view returns(uint256 rewards) {
        uint256 time = _timestamp - block.timestamp;
        uint256 mintable = _amount * time * mintRewardPerSec[_asset];
        rewards = mintable / 10 ** 18;
    }

    function freeToFmn(uint256 _freeAmount) public view returns(uint256 fmnCost) {
        (uint112 _reserve0, uint112 _reserve1, uint32 _ts) = pool.getReserves();
        uint256 fmnPerFree = _freeAmount * _reserve1;
        fmnCost = fmnPerFree / _reserve0;
    }

    function getPositionId(address _owner, address _asset, uint256 _termEnd) public pure returns(bytes32) {
        return bytes32(keccak256(abi.encodePacked(_owner, _asset, _termEnd)));
    }

    function farmingAssetCount() public view returns(uint256) {
        return farmingAssets.length;
    }

    function mintingAssetCount() public view returns(uint256) {
        return mintingAssets.length;
    }
}
