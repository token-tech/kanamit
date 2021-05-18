import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, tokenOwner } = await getNamedAccounts();

  let objKanamitCore = await deploy('KanamitCore', {
    from: deployer,
    args: [],
    log: true,
  });

  // console.log('objKanamitCore', objKanamitCore);

  let objKanamitTrade = await deploy('KanamitTrade', {
    from: deployer,
    args: [objKanamitCore.address],
    log: true,
  });

  // console.log('objKanamitTrade', objKanamitTrade);
};
export default func;
func.tags = ['KanamitCore', 'KanamitTrade'];