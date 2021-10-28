pragma solidity >=0.6.6 <0.8.0;
pragma experimental ABIEncoderV2;

import '../../utils/SafeMath.sol';
import '../../interfaces/5.0/UniswapV2Library.sol';
import '../../interfaces/5.0/IERC20.sol';
import '../../interfaces/5.0/IUniswapV2Pair.sol';
import '../../interfaces/5.0/IUniswapV2Factory.sol';
import '../../interfaces/6.0/IUniswapV2Router01.sol';
import '../../interfaces/6.0/IUniswapV2Router02.sol';
import "../../interfaces/5.0/IWeth.sol";


contract BakeryPancakeArbitrage {
    IWeth immutable WETH;
    address BakeryFactory;
    address BakeryRouter;
    address PancakeFactory;
    address PancakeRouter;
    address Beneficiary;
    constructor(address bakeryFactory, address pancakeFactory, address wethAddress, address bakeryRouter, address pancakeRouter, address beneficiaryAddress) public {
        BakeryFactory = bakeryFactory;
        BakeryRouter = bakeryRouter;
        PancakeFactory = pancakeFactory;
        PancakeRouter = pancakeRouter;
        Beneficiary = beneficiaryAddress;
        WETH = IWeth(wethAddress);
    }

    function startArbitrage(
        address token0,
        address token1,
        uint amount0,
        uint amount1,
        address startFactory,
        address endRouterAddress,
        uint repay
    ) external {

        address pairAddress =   IUniswapV2Factory(startFactory).getPair(token0, token1);
        require(pairAddress != address(0), 'This pool does not exist');
        IUniswapV2Pair(pairAddress).swap(
            amount0,
            amount1,
            address(this),
            abi.encode(endRouterAddress, repay) //not empty bytes param will trigger flashloan
        );
    }

    receive() external payable {}

    function pancakeCall(address sender, uint amount0, uint amount1, bytes calldata data) external {
        address[] memory path = new address[](2);
        ( address endRouter, uint repay) = abi.decode(data, (address, uint));
        uint amountToken;
        uint amountEth;
        IERC20 token;

        // scope for token{0,1}, avoids stack too deep errors
        {
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            path[0] = amount0 == 0 ? token1 : token0;
            path[1] = amount0 == 0 ? token0 : token1;

            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountEth = token0 == address(WETH) ? amount0 : amount1;
            token = IERC20(path[0] == address(WETH) ? path[1] : path[0]);

        }
        if (amountToken > 0) {
            token.approve(endRouter, amountToken);
            uint[] memory amountReceived = IUniswapV2Router02(endRouter).swapExactTokensForETH(amountToken, 0, path,address(this),block.timestamp);
            require(amountReceived[1] >= repay,"Failed to get enough from swap to repay");
            WETH.deposit{value: repay}();
            WETH.transfer(msg.sender, repay); // return WETH to V2 pair
            WETH.transfer(Beneficiary , address(this).balance); // keep the rest! (ETH)

        } else {
            WETH.withdraw(amountEth);
            uint [] memory amountReceived = IUniswapV2Router02(endRouter).swapExactETHForTokens{value: address(this).balance}(0, path, address(this), block.timestamp);
            require(amountReceived[1] > repay, "Failed to get enough from swap to repay"); // fail if we didn't get enough tokens back to repay our flash loan
            token.transfer(msg.sender, repay); // return tokens to V2 pair
            token.transfer(Beneficiary, token.balanceOf(address(this)));
        }
    }
}