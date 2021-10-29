
# Setup

- Install and make sure you are running Node JS 12
- Clone the Repo
- Open a Node terminal & change directory to the project root
- Run `npm install`
- Run `truffle compile`
- Copy `.env.example` to a new `.env` file and insert your secrets
- To start the program run `node ./`


# Deployments

- Modify the script prefixed with `1-` to specify which contract you would like to deploy.
- Run the migration with `trufle migrate --network <network_listed_in_config> --reset`

# Task Running

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello!"
```
# Testing

- Run npx hardhat node --fork YOUR_HTTPS_PROVIDER
- Open a new terminal and set the WebSocketProvider to consume `http://127.0.0.1/8545`
- Run the scripts and watch the terminal with the running chain. 
