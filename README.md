
# Setup

- Install and make sure you are running Node JS 12
- Clone the Repo
- Open a Node terminal & change directory to the project root
- Run `npm install`
- Run `truffle compile`
- Copy `.env.example` to a new `.env` file and insert your secrets
- To start the program run `node ./`


# Deployments
The migrations' folder holds the scripts for deploying the contracts categorized by type and chain.

You can use either Hardhat or Truffle to compile and deploy the contracts.

#### Hardhat

- Run `npx hardhat run --network <network> </migrations/hardhat/<chain>/<.js file>`

#### Truffle

- Modify the script prefixed with `1-` to specify which contract you would like to deploy.
- Run the migration with `truffle migrate --network <network_listed_in_config> --reset`

# Testing

- Run `npx hardhat node --fork YOUR_HTTPS_PROVIDER`
- Open a new terminal and set the WebSocketProvider to consume `http://127.0.0.1/8545`
- Run `npx hardhat run --network localhost </migrations/hardhat/<chain>/<.js file>`
- Start the program with `node ./`
- Run the scripts provided by selected `Local` in the prompt.

*Note* Make sure the services provided are using the `http://127.0.0.1/8545` websocket url. 
[Example](https://github.com/AfriaDev/DefiTerminal/blob/master/program/utils/monitor/ethereum/prices/kyber/kyberPriceMonitor.js#L43)


- Pending Hardhat test scripts


