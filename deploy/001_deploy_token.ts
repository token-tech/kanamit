import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer, tokenOwner} = await getNamedAccounts();

  await deploy('KanamitCore', {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy('KanamitTrade',{
    from: deployer,
    args: [],
    log: true,
  })
};
export default func;
func.tags = ['KanamitCore', 'KanamitTrade'];