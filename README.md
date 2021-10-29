
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

# Testing

- Run npx hardhat node --fork YOUR_HTTPS_PROVIDER
- Open a new terminal and set the WebSocketProvider to consume `http://127.0.0.1/8545`
- Run the scripts and watch the terminal with the running chain. 
