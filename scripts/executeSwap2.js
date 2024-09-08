const { ethers } = require("ethers")
require("dotenv").config()
const fs = require("fs")

// Initialize Provider
const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC);

// Initialize Wallet
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

// Initialize Uniswap Router Contract
const uniswapRouter = new ethers.Contract(
	"0xbb132C92318F116D5883724d12C949821D7083b1",
	fs.readFileSync("./build/swap_sol_UniswapV3SingleHopSwap.abi", "utf-8"),
	provider
);
const connectedUniswapRouter = uniswapRouter.connect(wallet)


const main = async () => {
	const tx = await connectedUniswapRouter.swapExactInputSingleHop(1000, 0, {
		gasLimit: 210000n,
        maxPriorityFeePerGas: 1000000000n, // ide rudaru
        maxFeePerGas: ethers.parseUnits('22', 'gwei') // mora bit >= od BaseFee (promijenjiv na BC-u) + maxPriorityFeePerGas
	})
	// const tx = await connectedUniswapRouter.swapExactInputSingleHop(1, 1, { 
	// 	gasLimit: 230000n, // ne ide manje od 21000 (za sad ;)
    //     maxPriorityFeePerGas: 1000000000n, // ide rudaru
    //     maxFeePerGas: ethers.parseUnits('22', 'gwei') // mora bit >= od BaseFee (promijenjiv na BC-u) + maxPriorityFeePerGas
	// })
	await tx.wait()
	console.log("Swap finished")
}

main()