// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MyUSD.sol";

contract Staking is Ownable, ReentrancyGuard {
    MyUSD public immutable myUSD;
    uint256 public totalStaked;
    uint256 public rewardPerStake;
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public rewardDebt;

    constructor(address _myUSD) Ownable(msg.sender) {
        myUSD = MyUSD(_myUSD);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        myUSD.transferFrom(msg.sender, address(this), amount);
        _updateRewards(msg.sender);
        stakedAmount[msg.sender] += amount;
        totalStaked += amount;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(stakedAmount[msg.sender] >= amount, "Not enough staked");
        _updateRewards(msg.sender);
        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;
        myUSD.transfer(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 rewards = rewardDebt[msg.sender];
        rewardDebt[msg.sender] = 0;
        myUSD.transfer(msg.sender, rewards);
    }

    function distributeRewards(uint256 amount) external onlyOwner {
        require(totalStaked > 0, "No stakers");
        rewardPerStake += (amount * 1e18) / totalStaked;
    }

    function _updateRewards(address user) internal {
        uint256 owed = ((stakedAmount[user] * rewardPerStake) / 1e18) - rewardDebt[user];
        rewardDebt[user] += owed;
    }
}
