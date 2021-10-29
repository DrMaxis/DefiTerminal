// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.6 <0.8.0;

import '../../utils/Ownable.sol';
import '../../utils/SafeMath.sol';
import '../../interfaces/5.0/UniswapV2Library.sol';
import '../../interfaces/6.0/IERC20.sol';
import '../../interfaces/5.0/IUniswapV2Pair.sol';
import '../../interfaces/5.0/IUniswapV2Factory.sol';
import '../../interfaces/6.0/IUniswapV2Router02.sol';

contract BakeryTokenSwap is Ownable {
    using SafeMath for uint;
    address private constant bakeryRouter = 0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F;

    constructor() {}

    function startSwap(
        address token0,
        address token1,
        uint amount0,
        uint amount1
    ) external {
        // transfer input tokens to this contract address
        IERC20(token0).transferFrom(msg.sender, address(this), amount0);
        // approve bakeryRouter to transfer tokens from this contract
        IERC20(token0).approve(bakeryRouter, amount0);

        address[] memory path;

        require(address(token1) != address(token0), "You cannot swap between the same tokens");

        path = new address[](2);
        path[0] = token0;
        path[1] = token1;

        IUniswapV2Router02(bakeryRouter).swapExactTokensForTokens(
            amount0,
            amount1,
            path,
            msg.sender,
            block.timestamp
        );
    }

    function destruct() public onlyOwner {
        address payable owner = payable(owner());
        selfdestruct(owner);
    }

    receive() external payable {}
}
