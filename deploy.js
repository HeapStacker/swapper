const ethers = require("ethers");
require('dotenv').config()
const fs = require("fs");

const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC)
const buildDir = process.env.CONTRACT_BUILD_DIR
const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)

let nonce
async function deployContract(currAbi, currBytecode, currArgs) {
    let contract, address
    for (const instance of currArgs) { 
        // korsitimo for of, ne for in (jer jer currArgs array odnosno iterabilan pa možemo odmah dobiti vrijednosti)
        // da smo koristili for in, instance bi davao indexe arraya currArgs => 0, 1, 2, ..., pa bi za vrijednost morali napisati currArgs[instance]
        // for in radi na objektima isto, na objektima možemo s for in ispisati nazive ključeva (prepertija)


        if (!instance.deployedAt) {
            console.log("Deploying contract...");
            console.log("Nonce = ", nonce)
            const contractFactory = new ethers.ContractFactory(currAbi, currBytecode, deployer);
            if (instance.arguments.length) {
            let args_ = instance.arguments.split(',').map(arg => {
                arg = arg.trim();
                if (!isNaN(Number(arg))) {
                    arg = ethers.toBigInt(arg);
                    console.log("Number arg = ", arg);
                }
                else {
                    console.log("String arg = ", arg)
                }
                return arg;
            });
                contract = await contractFactory.deploy(...args_, {nonce: nonce});
            }
            else {
                contract = await contractFactory.deploy({nonce: nonce});
            }
            await contract.waitForDeployment();
            if (address = await contract.getAddress()) {
                console.log(`Contract deployed at address: ${address}`);
                instance.deployedAt = address
                nonce += 1
            }
        }
    }
}

async function main() {
    const files = fs.readdirSync(buildDir);
    let currAbi, currBytecode, fileName, currArgs, contractName;
    nonce = await deployer.getNonce()
    
    for (let file of files) {
        fileName = undefined
        if (file.endsWith(".json")) {
            fileName = file
            currArgs = JSON.parse(fs.readFileSync(`${buildDir}/${file}`))
        } 
        if (fileName) {
            for (let file_ of files) { 
                if (!file_.endsWith(".json")) {
                    if (file_.endsWith(".abi") && fileName.includes(file_.substring(0, file_.search("_sol_")))) {
                        currAbi = JSON.parse(fs.readFileSync(`${buildDir}/${file_}`, 'utf-8'));
                    } 
                    if (file_.endsWith(".bin") && fileName.includes(file_.substring(0, file_.search("_sol_")))) {
                        currBytecode = fs.readFileSync(`${buildDir}/${file_}`, 'utf-8');
                    }
                    if (currAbi && currBytecode) {
                        contractName = file_.substring(file_.search("_sol_") + 5, file_.length - 4)
                        if (currArgs[contractName]) {
                            await deployContract(currAbi, currBytecode, currArgs[contractName]);
                        }
                        currAbi = currBytecode = undefined
                    }
                }
            }
            fs.writeFileSync(buildDir + '/' + fileName, JSON.stringify(currArgs, null, "\t")) // we set that some contracts are deployed
        }
    }
}

main().catch(console.error);