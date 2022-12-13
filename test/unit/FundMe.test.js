const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", async () => {
			let fundMe;
			let deployer;
			let mockV3Aggregator;
			const sendValue = ethers.utils.parseEther("1");
			beforeEach(async () => {
				// deploy fund me contract
				// using hardhat deploy
				deployer = (await getNamedAccounts()).deployer;
				await deployments.fixture(["all"]);
				fundMe = await ethers.getContract("FundMe", deployer);
				mockV3Aggregator = await ethers.getContract(
					"MockV3Aggregator",
					deployer
				);
			});
			describe("constructor", async () => {
				it("sets the aggregator addresses correctly", async () => {
					const response = await fundMe.getPriceFeed();
					assert.equal(response, mockV3Aggregator.address);
				});
			});

			describe("fund", async () => {
				it("fails if you don't send enough eth", async () => {
					await expect(fundMe.fund()).to.be.revertedWith(
						"You need to spend more ETH!"
					);
				});

				it("updates the amount funded data structure", async () => {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getAddressToAmountFunded(
						deployer
					);
					assert.equal(response.toString(), sendValue.toString());
				});
				it("adds funder to array of funders", async () => {
					await fundMe.fund({ value: sendValue });
					const funder = await fundMe.getFunder(0);
					assert.equal(funder, deployer);
				});
			});

			describe("withdraw", async () => {
				beforeEach(async () => {
					await fundMe.fund({ value: sendValue });
				});
				it("can withdraw ETH from a single founder", async () => {
					// Arrange
					const startingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Act
					const transactionResponse = await fundMe.cheaperWithdraw();
					const transactionReciept = await transactionResponse.wait(
						1
					);
					const { gasUsed, effectiveGasPrice } = transactionReciept;
					const gasCost = gasUsed.mul(effectiveGasPrice);
					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);
				});
				it("allows us to withdraw with mulitple funders", async () => {
					// Arrange

					// fund the account initially
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = await fundMe.connect(
							accounts[i]
						);
						await fundMeConnectedContract.fund({
							value: sendValue,
						});
					}

					const startingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);

					//Act
					const transactionResponse = await fundMe.cheaperWithdraw();
					const transactionReciept = await transactionResponse.wait(
						1
					);
					const { gasUsed, effectiveGasPrice } = transactionReciept;
					const gasCost = gasUsed.mul(effectiveGasPrice);
					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					//Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					// Make sure the funders are reset
					await expect(fundMe.getFunder(0)).to.be.reverted;

					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(
								accounts[i].address
							),
							0
						);
					}
				});

				it("only allows the owner to withdraw", async () => {
					const accounts = await ethers.getSigners();
					const attacker = accounts[1];
					const attackerConnectedContract = await fundMe.connect(
						attacker
					);
					await expect(
						attackerConnectedContract.cheaperWithdraw()
					).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
				});
			});
	  });
