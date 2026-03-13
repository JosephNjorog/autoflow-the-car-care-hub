const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log(`\n=== AutoFlow Payments Deployment ===`);
  console.log(`Network:  ${network}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} AVAX\n`);

  // AutoFlow's platform wallet — replace with your actual wallet before mainnet deploy
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;
  console.log(`Platform wallet: ${PLATFORM_WALLET}`);

  const AutoFlowPayments = await hre.ethers.getContractFactory("AutoFlowPayments");
  const contract = await AutoFlowPayments.deploy(PLATFORM_WALLET);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ AutoFlowPayments deployed to: ${address}`);

  if (network === "fuji") {
    console.log(`\nVerify on Fuji SnowTrace:`);
    console.log(`  https://testnet.snowtrace.io/address/${address}`);
    console.log(`\nTo verify source code:`);
    console.log(`  npx hardhat verify --network fuji ${address} "${PLATFORM_WALLET}"`);
  } else if (network === "avalanche") {
    console.log(`\nVerify on SnowTrace:`);
    console.log(`  https://snowtrace.io/address/${address}`);
    console.log(`\nTo verify source code:`);
    console.log(`  npx hardhat verify --network avalanche ${address} "${PLATFORM_WALLET}"`);
  }

  console.log(`\n=== Add to Vercel env vars ===`);
  console.log(`VITE_AUTOFLOW_CONTRACT=${address}`);
  console.log(`\n=== Token Addresses (Avalanche Mainnet) ===`);
  console.log(`USDT: 0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`);
  console.log(`USDC: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
