# **ReadMe**

## 参考链接
- [hardhat 教程及 hardhat-deploy 插件使用](https://learnblockchain.cn/article/2354)

## hardhat环境配置

```
##初始安装
$ yarn init --yes
$ yarn add -D hardhat

## 编辑 hardhat.config.ts

## 安装依赖
$ yarn add -D hardhat-deploy hardhat-deploy-ethers ethers chai chai-ethers mocha @types/chai @types/mocha @types/node typescript ts-node dotenv


## 编辑 tsconfig.json。

```

## 编译智能合约

- [可选]单个或者少量的.sol，也可以先用 remix编译，编译通过后再放hardhat编译，基本不会报错；

```
$ yarn hardhat compile
```

## 部署合约

```
## 编辑 deploy/001_deploy_token.ts

## 部署合约
$ yarn hardhat deploy

```

## 合约单元测试

```
$ npx hardhat test
```

## 链上合约测试

```
$ pwd 
.../test_at_fullnode

$ node KanamitTrade.js

...

```

## KanaToken和KanaShop部署
- KanaToken部署
- KanaShop部署
- KanaToken mint给owner
- owner把mint到的KanaToken转账给KanaShop


