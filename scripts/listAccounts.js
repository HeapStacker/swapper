const { ethers } = require("ethers");
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC);

async function listAccounts() {
    const accounts = await provider.listAccounts();
    for(let i = 0; i < accounts.length; i++) {
        accounts[i].balance = await provider.getBalance(accounts[i].address)
    }
    console.log("hehe")
    console.log("Accounts:", accounts);
}

listAccounts();