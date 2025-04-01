// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MyUSD.sol";

error Staking__InvalidAmount();
error Staking__InsufficientBalance();
error Staking__InsufficientAllowance();
error Staking__TransferFailed();

contract Staking is Ownable, ReentrancyGuard {
    MyUSD public immutable myUSD;
    uint256 public totalStaked;
    uint256 public rewardPerStake;
    uint256 public lastUpdateTime;
    uint256 public constant PRECISION = 1e18;

    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public rewardDebt;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount);

    constructor(address _myUSD) Ownable(msg.sender) {
        myUSD = MyUSD(_myUSD);
        lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Allows users to stake MyUSD tokens
     * @dev Updates the user's rewards before staking
     * @param amount The amount of MyUSD tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert Staking__InvalidAmount();

        _updateRewards(msg.sender);
        stakedAmount[msg.sender] += amount;
        totalStaked += amount;

        bool success = myUSD.transferFrom(msg.sender, address(this), amount);
        if (!success) revert Staking__TransferFailed();

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Allows users to withdraw staked MyUSD tokens
     * @dev Updates the user's rewards before withdrawal
     * @param amount The amount of MyUSD tokens to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert Staking__InvalidAmount();
        if (stakedAmount[msg.sender] < amount) revert Staking__InsufficientBalance();

        _updateRewards(msg.sender);
        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;

        bool success = myUSD.transfer(msg.sender, amount);
        if (!success) revert Staking__TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Allows users to claim their accumulated rewards
     * @dev Updates rewards before claiming and resets the user's reward debt
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 rewards = rewardDebt[msg.sender];
        if (rewards == 0) return;

        rewardDebt[msg.sender] = 0;
        bool success = myUSD.transfer(msg.sender, rewards);
        if (!success) revert Staking__TransferFailed();

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @notice Distributes rewards to all stakers based on their staked amount
     * @dev Called by the CoinEngine when interest is accrued from borrowers
     * @param amount The amount of MyUSD tokens to distribute as rewards
     */
    function distributeRewards(uint256 amount) external onlyOwner {
        if (amount == 0) return;
        if (totalStaked == 0) {
            lastUpdateTime = block.timestamp;
            return;
        }

        rewardPerStake += (amount * PRECISION) / totalStaked;
        emit RewardsDistributed(amount);
    }

    /**
     * @notice Updates a user's accumulated rewards
     * @dev Internal function to calculate and update a user's rewards based on their staked amount
     * @param user The address of the user to update rewards for
     */
    function _updateRewards(address user) internal {
        if (stakedAmount[user] == 0) return;

        uint256 rewards = ((stakedAmount[user] * rewardPerStake) / PRECISION) - rewardDebt[user];
        if (rewards > 0) {
            rewardDebt[user] += rewards;
        }
    }
}
