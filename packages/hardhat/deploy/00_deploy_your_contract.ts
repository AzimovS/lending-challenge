import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const memePriceOracle = await deploy("MemePriceOracle", {
    from: deployer,
    args: [1000000000000000000000n],
    log: true,
    autoMine: true,
  });

  await deploy("BasicLending", {
    from: deployer,
    args: [memePriceOracle.address],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const basicLending = await hre.ethers.getContract<Contract>("BasicLending", deployer);

  await deploy("MemeCoin", {
    from: deployer,
    // Contract constructor arguments
    args: [basicLending.target],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  const coinContract = await hre.ethers.getContract<Contract>("MemeCoin", deployer);

  await basicLending.setMemeCoin(coinContract.target);
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
// deployYourContract.tags = ["YourContract"];
