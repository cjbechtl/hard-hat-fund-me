require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
// require("./tasks/block-number");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

const GORELI_RPC_URL = process.env.GORELI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CMC_API_KEY = process.env.CMC_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
	},
	defaultNetwork: "hardhat",
	networks: {
		goerli: {
			url: GORELI_RPC_URL,
			accounts: [PRIVATE_KEY],
			chainId: 5,
			blockConfirmations: 6,
		},
		localhost: {
			url: "http://127.0.0.1:8545/",
			chainId: 31337,
		},
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},
	gasReporter: {
		enabled: true,
		outputFile: "gas-report.txt",
		noColors: true,
		currency: "USD",
		coinmarketcap: CMC_API_KEY,
		token: "ETH",
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
	},
};
