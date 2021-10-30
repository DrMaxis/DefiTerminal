pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import '../../utils/4.0/SafeMath.sol';
import "../../interfaces/5.0/pancakeswap/interfaces/IPancakeFactory.sol";
import "../../interfaces/5.0/pancakeswap/interfaces/IPancakePair.sol";
import "../../interfaces/5.0/pancakeswap/interfaces/IPancakeCallee.sol";
import "../../interfaces/5.0/pancakeswap/interfaces/IPancakeRouter02.sol";
import "../../interfaces/5.0/pancakeswap/interfaces/IBEP20.sol";
import "../../interfaces/5.0/IWeth.sol";
import "../../interfaces/5.0/apeswap/interfaces/IApeFactory.sol";
import "../../interfaces/5.0/apeswap/interfaces/IApePair.sol";
import "../../interfaces/5.0/apeswap/interfaces/IApeCallee.sol";
import "../../interfaces/5.0/apeswap/interfaces/IApeRouter02.sol";



contract PancakeApeArbitrage {
    IWeth immutable WETH;
    address PancakeFactory;
    address PancakeRouter;
    address ApeFactory;
    address ApeRouter;
    address Beneficiary;

    address private constant apeRouter = 0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7;
    address private constant apeFactory = 0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6;

    address private constant pancakeRouter = 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F;
    address private constant pancakeFactory = 0xBCfCcbde45cE874adCB698cC183deBcF17952812;



    constructor(address pancakeFactory, address apeFactory, address wBNBAddress, address pancakeRouter, address apeRouter, address beneficiaryAddress) public {
        PancakeFactory = pancakeFactory;
        PancakeRouter = pancakeRouter;
        ApeFactory = apeFactory;
        ApeRouter = apeRouter;
        WETH = IWeth(wBNBAddress);
        Beneficiary = beneficiaryAddress;

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

        if(startFactory ==  pancakeFactory) {
            address pairAddress =   IPancakeFactory(startFactory).getPair(token0, token1);

            require(pairAddress != address(0), 'This pool does not exist');
            IPancakePair(pairAddress).swap(
                amount0,
                amount1,
                address(this),
                abi.encode(endRouterAddress, repay) //not empty bytes param will trigger flashloan
            );


        } else {
            address pairAddress =   IApeFactory(startFactory).getPair(token0, token1);

            require(pairAddress != address(0), 'This pool does not exist');
            IApePair(pairAddress).swap(
                amount0,
                amount1,
                address(this),
                abi.encode(endRouterAddress, repay) //not empty bytes param will trigger flashloan
            );
        }

    }

    receive() external payable {}


    function pancakeCall(address sender, uint amount0, uint amount1, bytes calldata data) external  {
        address[] memory path = new address[](2);

        ( address endRouter, uint repay) = abi.decode(data, (address, uint));
        uint amountToken;
        uint amountBnb;
        IBEP20 token;

        // scope for token{0,1}, avoids stack too deep errors
        {
            address token0 = IPancakePair(msg.sender).token0();
            address token1 = IPancakePair(msg.sender).token1();
            path[0] = amount0 == 0 ? token1 : token0;
            path[1] = amount0 == 0 ? token0 : token1;

            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountBnb = token0 == address(WETH) ? amount0 : amount1;
            token = IBEP20(path[0] == address(WETH) ? path[1] : path[0]);

        }
        if (amountToken > 0) {
            token.approve(endRouter, amountToken);
            uint[] memory amountReceived = IApeRouter02(endRouter).swapExactTokensForETH(amountToken, 0, path,address(this),block.timestamp);
            require(amountReceived[1] >= repay,"Failed to get enough from swap to repay");
            WETH.deposit{value: repay}();
            WETH.transfer(msg.sender, repay); // return WETH to V2 pair
            WETH.transfer(Beneficiary , address(this).balance); // keep the rest! (ETH)

        } else {
            WETH.withdraw(amountBnb);
            uint [] memory amountReceived = IPancakeRouter02(endRouter).swapExactETHForTokens{value: address(this).balance}(0, path, address(this), block.timestamp);
            require(amountReceived[1] > repay, "Failed to get enough from swap to repay"); // fail if we didn't get enough tokens back to repay our flash loan
            token.transfer(msg.sender, repay); // return tokens to V2 pair
            token.transfer(Beneficiary, token.balanceOf(address(this)));
        }
    }

    function apeCall(address sender, uint amount0, uint amount1, bytes calldata data) external  {
        address[] memory path = new address[](2);

        ( address endRouter, uint repay) = abi.decode(data, (address, uint));
        uint amountToken;
        uint amountBnb;
        IBEP20 token;

        // scope for token{0,1}, avoids stack too deep errors
        {
            address token0 = IPancakePair(msg.sender).token0();
            address token1 = IPancakePair(msg.sender).token1();
            path[0] = amount0 == 0 ? token1 : token0;
            path[1] = amount0 == 0 ? token0 : token1;

            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountBnb = token0 == address(WETH) ? amount0 : amount1;
            token = IBEP20(path[0] == address(WETH) ? path[1] : path[0]);

        }
        if (amountToken > 0) {
            token.approve(endRouter, amountToken);
            uint[] memory amountReceived = IApeRouter02(endRouter).swapExactTokensForETH(amountToken, 0, path,address(this),block.timestamp);
            require(amountReceived[1] >= repay,"Failed to get enough from swap to repay");
            WETH.deposit{value: repay}();
            WETH.transfer(msg.sender, repay); // return WETH to V2 pair
            WETH.transfer(Beneficiary , address(this).balance); // keep the rest! (ETH)

        } else {
            WETH.withdraw(amountBnb);
            uint [] memory amountReceived = IPancakeRouter02(endRouter).swapExactETHForTokens{value: address(this).balance}(0, path, address(this), block.timestamp);
            require(amountReceived[1] > repay, "Failed to get enough from swap to repay"); // fail if we didn't get enough tokens back to repay our flash loan
            token.transfer(msg.sender, repay); // return tokens to V2 pair
            token.transfer(Beneficiary, token.balanceOf(address(this)));
        }
    }


}