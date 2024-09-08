const { ethers } = require('ethers')
const { abi: UniswapV3Factory } = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')
require('dotenv').config()

const wbtc = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC)

  const factoryContract = new ethers.Contract(
    factoryAddress,
    UniswapV3Factory,
    provider
  )

  const poolAddress = await factoryContract.getPool(wbtc, usdc, 3000)
  console.log('poolAddress:', poolAddress)

}

main()
