const fs = require("fs")
require("dotenv").config()
const path = require("path")
const { execSync } = require("child_process")

const solcVersion = process.env.SOLIDITY_COMPILER_VER
const contractFolder = process.env.CONTRACT_DIR
const buildDir = process.env.CONTRACT_BUILD_DIR
const lastStateFolder = process.env.LAST_CONTRACT_STATE_DIR

const cleanBeforeCompilation = false     // clean everything from build and state before compilation
const removeUnnecessaryBuiltFiles = true // probably just interfaces will be removed from build

// --------------------------------------------------------------

function system(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (err) {
        console.error("error:", err.message);
    }
}

execSync("npm list -g", (err, stdout, stderr) => {
    let instalationNeeded = true
    stdout.split('\n').forEach(package => {
        if (package.includes("solc") && package.endsWith(solcVersion)) {
            instalationNeeded = false
        }
    });
    if (instalationNeeded) { system("npm i -g solc@" + solcVersion) }
})

// --------------------------------------------------------------

if (!fs.existsSync(contractFolder)) {
    fs.mkdirSync(contractFolder)
}

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir)
}

if (!fs.existsSync(lastStateFolder)) {
    fs.mkdirSync(lastStateFolder)
}

if (cleanBeforeCompilation) { 
    fs.readdirSync(buildDir).forEach(file => {
        fs.unlinkSync(`${buildDir}/${file}`)
    });
    fs.readdirSync(lastStateFolder).forEach(file => {
        fs.unlinkSync(`${lastStateFolder}/${file}`)
    });
}

// --------------------------------------------------------------
// if last state directory is empty push contracts there (means that there were no compilations yet)

// if the last state folder is set (with the latest changes to the contract) and the build folder is empty, you need to delete the last state folder so that the files are generated correctly again
if (!fs.readdirSync(buildDir).length && fs.readdirSync(lastStateFolder).length) {
    fs.readdirSync(lastStateFolder).forEach(file => {
        fs.unlinkSync(`${lastStateFolder}/${file}`)
    });
}

let firstCompilation = true
if (!fs.readdirSync(lastStateFolder).length) {
    fs.readdirSync(contractFolder).forEach(contract => {
        fs.writeFileSync(`${lastStateFolder}/${contract}.mem`, "", 'utf-8')
    });
    
    fs.readdirSync(buildDir).forEach(file => {
        fs.unlinkSync(`${buildDir}/${file}`)
    });
}


// --------------------------------------------------------------
// load necessary files...
// this files wont be updated but will remain in the build folder
let necessaryFiles = new Set()

fs.readdirSync(buildDir).forEach(file => {
    necessaryFiles.add(file)
})

// --------------------------------------------------------------

let currProcessingFile, filesToCompie = []
fs.readdirSync(contractFolder).forEach(file => {
    if (!file.endsWith(".sol")) {
        console.error("File " + file + " doesn't have .sol extension.")
        throw new Error("File " + file + " doesn't have .sol extension.")
    }
    currProcessingFile = fs.readFileSync(`${contractFolder}/${file}`, 'utf-8')
    lastCompiledState = fs.readFileSync(`${lastStateFolder}/${file}.mem`, 'utf-8')
    if (currProcessingFile != lastCompiledState) {
        fs.copyFileSync(`${contractFolder}/${file}`, `${lastStateFolder}/${file}.mem`)
        
        system(`solcjs --bin --abi --include-path node_modules/ --include-path contracts/ --base-path . -o ${buildDir} ${contractFolder}/${file}`)
        
        let arguments = []
        let contractName = undefined
        let contractArguments = new Map()
        currProcessingFile.split('\n').forEach(line => {
            if (line.trim().startsWith("contract")) {
                if (contractName) { 
                    contractArguments.set(contractName, arguments)
                    arguments = []
                }
                contractName = line.trim().split(' ')[1]
                necessaryFiles.add(file.substring(0, file.length - 4) + "_sol_" + contractName + ".abi")
                necessaryFiles.add(file.substring(0, file.length - 4) + "_sol_" + contractName + ".bin")
                filesToCompie.push(file.substring(0, file.length - 4) + "_sol_" + contractName)
            }
            if (line.trim().startsWith("//INIT:")) {
                let argument = new Object()
                argument.deployedAt = null // ak staviš undefined, neće se prikazati key u json-u
                argument.arguments = line.trim().substring(7).trim().replaceAll('\r', '')
                arguments.push(argument)
            }
        });
        contractArguments.set(contractName, arguments)
        fs.writeFileSync(buildDir + '/' + file.substring(0, file.length - 4) + ".json", JSON.stringify(Object.fromEntries(contractArguments), null, "\t"))
        necessaryFiles.add(file.substring(0, file.length - 4) + ".json")
    }
});

// --------------------------------------------------------------
// log...

if (filesToCompie.length) {
    console.log("Compiled files and contracts are...")
    filesToCompie.forEach(contract => {
        console.log(contract)
    });
}
else {
    console.log("No contract needs to be compiled.")
}

// --------------------------------------------------------------

// final touch... 
// todo: ovaj način nije dobar, popravi!
fs.readdirSync(buildDir).forEach(file => {
    if (file.startsWith('contracts_')) {
        fs.renameSync(`${buildDir}/${file}`, `${buildDir}/${file.substring(10)}`)
    }
});

if (removeUnnecessaryBuiltFiles) {
    fs.readdirSync(buildDir).forEach(file => {
        if (!necessaryFiles.has(file)) {
            fs.unlinkSync(`${buildDir}/${file}`)
        }
    });
}