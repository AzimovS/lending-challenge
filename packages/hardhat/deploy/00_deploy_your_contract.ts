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

  await deploy("Corn", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
  const cornToken = await hre.ethers.getContract<Contract>("Corn", deployer);

  await deploy("CornDEX", {
    from: deployer,
    args: [cornToken.target],
    log: true,
    autoMine: true,
  });
  const cornDEX = await hre.ethers.getContract<Contract>("CornDEX", deployer);
  const basicLending = await deploy("BasicLending", {
    from: deployer,
    args: [cornDEX.target, cornToken.target],
    log: true,
    autoMine: true,
  });

  // Set up the move price contract
  const movePrice = await deploy("MovePrice", {
    from: deployer,
    args: [cornDEX.target, cornToken.target],
    log: true,
    autoMine: true,
  });

  // Give ETH and CORN to the move price contract
  await hre.ethers.provider.send("hardhat_setBalance", [
    movePrice.address,
    `0x${hre.ethers.parseEther("10000000000000000000000").toString(16)}`,
  ]);
  await cornToken.mintTo(movePrice.address, hre.ethers.parseEther("10000000000000000000000"));
  // Give CORN and ETH to the deployer
  await cornToken.mintTo(deployer, hre.ethers.parseEther("1000000000000"));
  await hre.ethers.provider.send("hardhat_setBalance", [
    deployer,
    `0x${hre.ethers.parseEther("100000000000").toString(16)}`,
  ]);

  await cornToken.transferOwnership(basicLending.address);
  await cornToken.approve(cornDEX.target, hre.ethers.parseEther("1000000000"));
  await cornDEX.init(hre.ethers.parseEther("1000000000"), { value: hre.ethers.parseEther("1000000") });

};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
// deployYourContract.tags = ["YourContract"];
