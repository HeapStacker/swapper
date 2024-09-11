// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

address constant SWAP_ROUTER_02 = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
IWETH constant weth = IWETH(WETH);

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount)
        external
        returns (bool);
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Swap {
    ISwapRouter02 private constant router = ISwapRouter02(SWAP_ROUTER_02);

    function getWethFromEth() public payable {
        weth.deposit{ value: msg.value }();
        weth.transfer(msg.sender, weth.balanceOf(address(this)));
    }

    function swapExactInputSingleHop(address tokenIn, address tokenOut)
        external
    {
        uint256 allowance = IERC20(tokenIn).allowance(msg.sender, address(this));
        require(allowance > 0, "TokenIn need's to be approved first.");

        weth.transferFrom(msg.sender, address(this), allowance);
        weth.approve(address(router), allowance);

        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02
            .ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 3000,
            recipient: msg.sender,
            amountIn: allowance,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        router.exactInputSingle(params);
    }
}