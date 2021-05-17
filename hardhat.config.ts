import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.6.12',
  },
  namedAccounts: {
    deployer: 0,
    tokenOwner: 1,
    user0:2,
  },
};
export default config;
