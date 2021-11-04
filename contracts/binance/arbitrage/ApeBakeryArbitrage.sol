pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import '../../utils/SafeMath.sol';
import '../../interfaces/5.0/UniswapV2Library.sol';
import '../../interfaces/6.0/IERC20.sol';
import '../../interfaces/5.0/IUniswapV2Pair.sol';
import '../../interfaces/5.0/IUniswapV2Factory.sol';
import '../../interfaces/6.0/IUniswapV2Router01.sol';
import '../../interfaces/6.0/IUniswapV2Router02.sol';
import "../../interfaces/5.0/IWeth.sol";


contract ApeBakeryArbitrage {
    IWeth immutable WETH;
    address Beneficiary;
    address ApeSwapFactory;
    address BakeryFactory;
    address BakeryRouter;
    address ApeRouter;
    constructor(address apeFactory, address bakeryFactory, address wethAddress , address bakeryRouter, address apeRouter, address beneficiaryAddress) public {
        ApeSwapFactory = apeFactory;
        BakeryFactory = bakeryFactory;
        WETH = IWeth(wethAddress);
        Beneficiary = beneficiaryAddress;
        BakeryRouter = bakeryRouter;
        ApeRouter = apeRouter;
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


        // scope for token{0,1}, avoids stack too deep errors
        {
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            path[0] = amount0 == 0 ? token1 : token0;
            path[1] = amount0 == 0 ? token0 : token1;

            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountEth = token0 == address(WETH) ? amount0 : amount1;

        }
        IERC20 token = IERC20(path[0] == address(WETH) ? path[1] : path[0]);

        if (amountToken > 0) {
            token.approve(endRouter, amountToken);
            uint[] memory amountReceived = IUniswapV2Router02(endRouter).swapExactTokensForETH(amountToken, 0, path,address(this),block.timestamp);
            WETH.deposit{value: amountReceived[1]}();
            require(WETH.transfer(msg.sender, repay), "Could Not Repay loan amount!"); // return WETH to V2 pair
            if(amountReceived[1] - repay > 0) {
                WETH.transfer(Beneficiary, (amountReceived[1] - repay));
            }
        } else {
            WETH.withdraw(amountEth);
            uint [] memory amountReceived = IUniswapV2Router02(endRouter).swapExactETHForTokens{value: address(this).balance}(0, path, address(this), block.timestamp);
            require(amountReceived[1] > repay, "Failed to get enough from swap to repay"); // fail if we didn't get enough tokens back to repay our flash loan
            token.transfer(msg.sender, repay); // return tokens to V2 pair
            if(amountReceived[1] - repay > 0) {
                token.transfer(Beneficiary, token.balanceOf(address(this)));
            }

        }
    }
}