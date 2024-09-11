import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
let provider, signer, swapContract, wethContract, realWethContract;


const swapAddress = '0x6068b71D1E558AeEcB0217E2E782D83A4F07958c'
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"


const swapABI = [
	"function swapExactInputSingleHop(address tokenIn, address tokenOut) external",
	"function getWethFromEth() public payable",
	"function getEthFromWeth() public"
];
const tokenABI = [
	"function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
	"function balanceOf(address account) external view returns (uint256)",
	"function decimals() view returns (uint8)"
];
const wethABI = [
	"function deposit() external payable",
    "function withdraw(uint256 amount) external"
]

function checkForWallet() {
	if (!signer) {
		alert("Wallet not connected!")
        return false
    }
	return true
}


// connect the wallet to dapp-------------------------------------------------------

document.getElementById('connectWallet').addEventListener('click', async () => {
	try {
		if (window.ethereum) {
			provider = new ethers.BrowserProvider(window.ethereum)
			console.log("provider:", provider)
			signer = await provider.getSigner()
			console.log("signer:", signer)
			document.getElementById("connectedWalletAddress").innerText = signer.address
			
			swapContract = new ethers.Contract(swapAddress, swapABI, signer)
			wethContract = new ethers.Contract(wethAddress, tokenABI, signer)
			realWethContract = new ethers.Contract(wethAddress, wethABI, signer)
		} else {
			console.error('Ethereum provider not found. Install MetaMask.');
		}
	} catch (error) {
		console.error('Error connecting wallet:', error);
	}
});


// token swapping-------------------------------------------------------------------

document.getElementById('swap').addEventListener('click', async () => {
	if (checkForWallet()) {

		const token1 = document.getElementById("tokenIn").value 
		const tokenContract = new ethers.Contract(token1, tokenABI, signer)
		const amount = ethers.parseUnits(document.getElementById('tokenInAmount').value, await tokenContract.decimals())
		const token2 = document.getElementById("tokenOut").value
		
		try {
			const tx1 = await tokenContract.approve(swapAddress, amount)
			await tx1.wait()
			const tx2 = await swapContract.swapExactInputSingleHop(token1, token2)
			await tx2.wait()
			alert('Swap successful')
		} catch (error) {
			console.error('Error swapping tokens:', error);
		}
	}
});

document.getElementById('depositETH').addEventListener('click', async () => {
    if (checkForWallet()) {
        try {
			const deductPosibleFee = ethers.parseUnits("10000000", "gwei")
            const balance = await provider.getBalance(signer.address) - deductPosibleFee
			if (balance < 0n) {
				throw new Error("You can't deposit any more eth.");
			}
            const tx = await realWethContract.deposit({ value: balance });
            await tx.wait();
            alert('ETH successfully deposited into WETH');
        } catch (error) {
            console.error('Error depositing ETH:', error);
        }
    }
});

document.getElementById('withdrawETH').addEventListener('click', async () => {
    if (checkForWallet()) {
        try {
            const wethBalance = await wethContract.balanceOf(signer.address);
            const tx = await realWethContract.withdraw(wethBalance);
            await tx.wait();
            alert('WETH successfully withdrawn to ETH');
        } catch (error) {
            console.error('Error withdrawing WETH:', error);
        }
    }
});



// balance checking-----------------------------------------------------------------

document.getElementById('checkWeth').addEventListener('click', async () => {
	if (checkForWallet()) {
		const wethBalance = await wethContract.balanceOf(signer.address)
		alert(`Weth balance: ${ethers.formatUnits(wethBalance, 18) } WETH`)
	}
})

document.getElementById('checkToken').addEventListener('click', async () => {
    if (checkForWallet()) {
		try {
			const addy = document.getElementById("tokenAddress").value;
			if (!ethers.isAddress(addy)) {
				alert("Invalid token address");
				return;
			}
	
			const token = new ethers.Contract(addy, tokenABI, provider);
	
			const balance = await token.balanceOf(signer.address);
			const decimals = await token.decimals();
			console.log(ethers.formatUnits(balance, decimals))
			// alert(`Token balance: ${balance / BigInt(10 ** decimals)}`);
		} catch (error) {
			alert('Failed to fetch token balance. Check console for details.');
		}
	}
});
