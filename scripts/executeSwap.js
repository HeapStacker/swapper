const { ethers } = require("ethers");
require("dotenv").config()
const fs = require('fs');

// Configuration
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";  // UNI contract address on mainnet
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH contract address on mainnet
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router

// Initialize Provider
const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC);

// Initialize Wallet
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

// Initialize Uniswap Router Contract
const uniswapRouter = new ethers.Contract(
	UNISWAP_ROUTER_ADDRESS,
	fs.readFileSync("./scripts/uniswapRouterAbi.json", "utf-8"),
	provider
);

async function swapUNIforETH(amountUNI) {
	// Approve the Uniswap router to spend UNI tokens
	const uniContract = new ethers.Contract(UNI_ADDRESS, [
		"function approve(address _spender, uint256 _value) public returns (bool success)"
	], provider);
	
	// Approve UNI spending for the Router
	const approvalTx = await uniContract.connect(wallet).approve(UNISWAP_ROUTER_ADDRESS, ethers.MaxUint256);
	await approvalTx.wait();
	console.log(`Approved Uniswap Router to spend UNI tokens`);

	// Set the swap parameters
	const amountOutMin = 0; // You can set this to a specific amount to avoid front-running risks.
	const path = [UNI_ADDRESS, WETH_ADDRESS];  // Swap UNI to WETH (which is wrapped ETH)
	const to = wallet.address;  // Destination address
	const deadline = Math.floor(Date.now() / 1000) + 60 * 20;  // 20 minutes from the current Unix time

	// Swap UNI for ETH
	try {
		const tx = await uniswapRouter.connect(wallet).swapExactTokensForETH(
			ethers.parseUnits(amountUNI, 18),  // Convert amountUNI to correct decimals (18 for UNI)
			amountOutMin,
			path,
			to,
			deadline
		);

		const receipt = await tx.wait();

		console.log(`Swap transaction completed. Transaction hash: ${receipt.transactionHash}`);
	} catch (error) {
		console.error("Error during swap:", error);
	}
}

// Start the swap with a specified amount of UNI
swapUNIforETH("1.0");  // Swapping 1 UNI to ETH
