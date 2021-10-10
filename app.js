require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const http = require('http')
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const moment = require('moment-timezone')
const numeral = require('numeral')
const _ = require('lodash')
const {mainnet, kovan, ropsten} = require('./addresses');

const {Command} = require('commander');
const program = new Command();
program.version('0.0.1');
program
  .option('-help, -debug', 'output extra debugging')
  .option('-n, -network, <network>', 'Which Network Are We Connecting To')
  .option('-b, -borrow <token>', 'What Currency Are You Borrowing?')
  .option('-ba, -borrowAmount <token>', 'Borrow Amount')
  .option('-s, -sell <token>', 'What Currency Will Be The Arbitrage Token')
  .option('-exa, -exchangea, <exchange>', 'Exchange A For Arbitrage')
  .option('-exb, -exchangeb, <exchange>', 'Exchange B For Arbitrage');
program.parse(process.argv);
const params = program.opts();
let network, borrowToken, borrowAmount, sellToken, exchangeA, exchangeB;
borrowAmount = params.borrowAmount;



// setup network
switch (params.network) {
  case '-m' || 'main' || 'mainnet':
    network = {
      'name': _.toUpper('mainnet'),
      'url': process.env.MAINNET_INFURA_URL,
      'secret': process.env.PRIVATE_KEY,
    }
    break;
  case '-k' || 'kovan':
    network = {
      'name': _.toUpper('kovan'),
      'url': process.env.KOVAN_INFURA_URL,
      'secret': process.env.PRIVATE_KEY,
    }
    break;
  case '-r' || 'rop' || 'ropsten':
    network = {
      'name': _.toUpper('ropsten'),
      'url': process.env.ROPSTEN_INFURA_URL,
      'secret': process.env.PRIVATE_KEY,
    }
    break;
  default:
    network = {
      'name': _.toUpper('ropsten'),
      'url': process.env.ROPSTEN_INFURA_URL,
      'secret': process.env.PRIVATE_KEY,
    }
}

// WEB3 CONFIG
const web3 = new Web3(new HDWalletProvider(network.secret, network.url))

// setup exchanges

switch (params.exchangea) {
  case '-u' || '-uni' || _.toLower('Uniswap'):
    if(network.name === _.toUpper('mainnet')) {
      exchangeA = {
        'address': mainnet.uniswap.router.address,
        'ABI': mainnet.uniswap.router.ABI,
        'contract': new web3.eth.Contract(mainnet.uniswap.router.ABI, mainnet.uniswap.router.address )
      }
    }
    if(network.name === _.toUpper('kovan')) {
      exchangeA = {
        'address': kovan.uniswap.router.address,
        'ABI': kovan.uniswap.router.ABI,
        'contract': new web3.eth.Contract(kovan.uniswap.router.ABI, kovan.uniswap.router.address )
      }
    }
    if(network.name === _.toUpper('ropsten')) {
      exchangeA = {
        'address': ropsten.uniswap.router.address,
        'ABI': ropsten.uniswap.router.ABI,
        'contract': new web3.eth.Contract(ropsten.uniswap.router.ABI, ropsten.uniswap.router.address )
      }
    }
    break;
  case '-k' || '-kyber' || _.toLower('kyber'):
    if(network.name === _.toUpper('mainnet')) {
      exchangeA = {
        'address': mainnet.kyber.proxy.address,
        'ABI': mainnet.kyber.proxy.ABI,
        'contract': new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address )
      }
    }
    if(network.name === _.toUpper('kovan')) {
      exchangeA = {
        'address': kovan.kyber.proxy.address,
        'ABI': kovan.kyber.proxy.ABI,
        'contract': new web3.eth.Contract(kovan.kyber.proxy.ABI, kovan.kyber.proxy.address )
      }
    }
    if(network.name === _.toUpper('ropsten')) {
      exchangeA = {
        'address': ropsten.kyber.proxy.address,
        'ABI': ropsten.kyber.proxy.ABI,
        'contract': new web3.eth.Contract(ropsten.kyber.proxy.ABI, ropsten.kyber.proxy.address )
      }
    }
    break;
    //TODO: SETUP DEFAULT EXCHANGES
}

if(exchangeA === null || exchangeA === exchangeB) {
  console.log(('Exchanges are the same'));
  process.exit(1);
}

switch (params.exchangeb) {
  case '-u' || '-uni' || _.toLower('Uniswap'):
    if(network.name === _.toUpper('mainnet')) {
      exchangeB = {
        'address': mainnet.uniswap.router.address,
        'ABI': mainnet.uniswap.router.ABI,
        'contract': new web3.eth.Contract(mainnet.uniswap.router.ABI, mainnet.uniswap.router.address )
      }
    }
    if(network.name === _.toUpper('kovan')) {
      exchangeB = {
        'address': kovan.uniswap.router.address,
        'ABI': kovan.uniswap.router.ABI,
        'contract': new web3.eth.Contract(kovan.uniswap.router.ABI, kovan.uniswap.router.address )
      }
    }
    if(network.name === _.toUpper('ropsten')) {
      exchangeB = {
        'address': ropsten.uniswap.router.address,
        'ABI': ropsten.uniswap.router.ABI,
        'contract': new web3.eth.Contract(ropsten.uniswap.router.ABI, ropsten.uniswap.router.address )
      }
    }
    break;
  case '-k' || '-kyber' || _.toLower('kyber'):
    if(network.name === _.toUpper('mainnet')) {
      exchangeB = {
        'address': mainnet.kyber.proxy.address,
        'ABI': mainnet.kyber.proxy.ABI,
        'contract': new web3.eth.Contract(mainnet.kyber.proxy.ABI, mainnet.kyber.proxy.address )
      }
    }
    if(network.name === _.toUpper('kovan')) {
      exchangeB = {
        'address': kovan.kyber.proxy.address,
        'ABI': kovan.kyber.proxy.ABI,
        'contract': new web3.eth.Contract(kovan.kyber.proxy.ABI, kovan.kyber.proxy.address )
      }
    }
    if(network.name === _.toUpper('ropsten')) {
      exchangeB = {
        'address': ropsten.kyber.proxy.address,
        'ABI': ropsten.kyber.proxy.ABI,
        'contract': new web3.eth.Contract(ropsten.kyber.proxy.ABI, ropsten.kyber.proxy.address )
      }
    }
    break;
  //TODO: SETUP DEFAULT EXCHANGES
}

const DIRECTION = {
  [`${_.toUpper(exchangeA.name)}_to_${_.toUpper(exchangeB)}`]: 0,
  [`${_.toUpper(exchangeB.name)}_to_${_.toUpper(exchangeA)}`]: 1
};

//set up borrow token
switch (params.borrow) {
  case '-d' || _.toLower('dai'):
    let d = 'DAI';
    if (network.name === 'MAINNET') {
      borrowToken = {
        'name': d,
        'address': mainnet.tokens.dai,
        'contract': new web3.eth.Contract(mainnet.tokens.dai.ABI, mainnet.tokens.dai.address)
      }
    }
    if (network.name === 'KOVAN') {
      borrowToken = {
        'name': d,
        'address': kovan.tokens.dai,
        'contract': new web3.eth.Contract(kovan.tokens.dai.ABI, kovan.tokens.dai.address)
      }
    }
    if (network.name === 'ROPSTEN') {
      borrowToken = {
        'name': d,
        'address': kovan.tokens.dai,
        'contract': new web3.eth.Contract(ropsten.tokens.dai.ABI, ropsten.tokens.dai.address)
      }
    }
    break;
  case '-weth' || _.toLower('weth'):
    let w = 'WETH';
    if (network.name === 'MAINNET') {
      borrowToken = {
        'name': w,
        'address': mainnet.tokens.weth,
        'contract': new web3.eth.Contract(mainnet.tokens.weth.ABI, mainnet.tokens.weth.address)
      }
    }
    if (network.name === 'KOVAN') {
      borrowToken = {
        'name': w,
        'address': kovan.tokens.weth,
        'contract': new web3.eth.Contract(kovan.tokens.weth.ABI, kovan.tokens.weth.address)
      }
    }
    if (network.name === 'ROPSTEN') {
      borrowToken = {
        'name': w,
        'address': ropsten.tokens.weth,
        'contract': new web3.eth.Contract(ropsten.tokens.weth.ABI, ropsten.tokens.weth.address)
      }
    }
    break;
  case '-usdc' || _.toLower('usdc'):
    let u = 'USDC'
    if (network.name === 'MAINNET') {
      borrowToken = {
        'name': u,
        'address': mainnet.tokens.usdc,
        'contract': new web3.eth.Contract(mainnet.tokens.usdc.ABI, mainnet.tokens.usdc.address)
      }
    }
    if (network.name === 'KOVAN') {
      borrowToken = {
        'name': u,
        'address': kovan.tokens.usdc,
        'contract': new web3.eth.Contract(kovan.tokens.usdc.ABI, kovan.tokens.usdc.address)
      }
    }
    if (network.name === 'ROPSTEN') {
      borrowToken = {
        'name': u,
        'address': ropsten.tokens.usdc,
        'contract': new web3.eth.Contract(ropsten.tokens.usdc.ABI, ropsten.tokens.usdc.address)
      }
    }
    break;
  default:
    let dx = 'DAI';
    if (network.name === 'MAINNET') {
      borrowToken = {
        'name': dx,
        'address': mainnet.tokens.dai,
        'contract': new web3.eth.Contract(mainnet.tokens.dai.ABI, mainnet.tokens.dai.address)
      }
    }
    if (network.name === 'KOVAN') {
      borrowToken = {
        'name': dx,
        'address': kovan.tokens.dai,
        'contract': new web3.eth.Contract(kovan.tokens.dai.ABI, kovan.tokens.dai.address)
      }
    }
    if (network.name === 'ROPSTEN') {
      borrowToken = {
        'name': dx,
        'address': ropsten.tokens.dai,
        'contract': new web3.eth.Contract(ropsten.tokens.dai.ABI, ropsten.tokens.dai.address)
      }
    }
}


const RECENT_ETH_PRICE = 230;
const AMOUNT_ETH_WEI = web3.utils.toWei(borrowAmount.toString());
const AMOUNT_DAI_WEI = web3.utils.toWei((borrowAmount * RECENT_ETH_PRICE).toString());
