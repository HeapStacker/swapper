const { ethers } = require("ethers");
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC)
const userAddress = process.env.RICH_MAN

// balance checking...
provider.getBalance(userAddress)
    .then(bal => { console.log(`Balance = ${ethers.formatEther(bal)} ETH or ${bal} WEI`) })



// token listing...
const erc20ABI = [
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)"
];

const tokens = [
    "0xa9D54F37EbB99f83B603Cc95fc1a5f3907AacCfd", 
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0xf05897CfE3CE9BBBfE0751CBE6B1B2c686848DCb",
    "0x0Ae055097C6d159879521C384F1D2123D1f195e6"
];

async function getBalances() {
    for (let i = 0; i < tokens.length; i++) {
        const contract = new ethers.Contract(tokens[i], erc20ABI, provider);
        const tokenSymbol = await contract.symbol()
        const balance = await contract.balanceOf(userAddress);

        console.log(`${ethers.formatUnits(balance, 18)} ${tokenSymbol}`);
    }
    console.log("----------------------------------------------")
}

getBalances();