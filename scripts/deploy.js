const { ethers } = require('hardhat');

async function main() {
  const transactionCount = await owner.getTransactionCount();

  // gets the address of the token before it is deployed
  const futureAddress = ethers.utils.getContractAddress({
    from: owner.address,
    nonce: transactionCount + 1,
  });

  const MyGovernor = await ethers.getContractFactory('MyGovernor');
  const governor = await MyGovernor.deploy(futureAddress);

  const MyToken = await ethers.getContractFactory('MyToken');
  const token = await MyToken.deploy(governor.address);

  await token.delegate(owner.address);

  const tx = await governor.propose(
    [token.address],
    [0],
    [
      token.interface.encodeFunctionData('mint', [
        owner.address,
        parseEther('25000'),
      ]),
    ],
    'Give the owner more tokens!'
  );
  const receipt = await tx.wait();
  const event = receipt.events.find((x) => x.event === 'ProposalCreated');
  const { proposalId } = event.args;

  // wait for the 1 block voting delay
  await hre.network.provider.send('evm_mine');

  const txCastVote = await governor.castVote(proposalId, 1);

  console.log(txCastVote);

  await governor.execute(
    [token.address],
    [0],
    [
      token.interface.encodeFunctionData('mint', [
        owner.address,
        parseEther('25000'),
      ]),
    ],
    keccak256(toUtf8Bytes('Give the owner more tokens!'))
  );

  console.log(
    `Governor deployed to ${governor.address}`,
    `Token deployed to ${token.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
