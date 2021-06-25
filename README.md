# **ReadMe**

## Reference 


- [hardhat and hardhat-deploy Plugin Tutorial]https://learnblockchain.cn/article/2354

## hardhat  Development Information
```
##Set up
$ yarn init --yes
$ yarn add -D hardhat

## Edit hardhat.config.ts

## Installing Dependencies
$ yarn add -D hardhat-deploy hardhat-deploy-ethers ethers chai chai-ethers mocha @types/chai @types/mocha @types/node typescript ts-node dotenv


## Edit tsconfig.json。

```

## Compiling contract

- [Optional]One or a few .sol, you can use remix to compiling first, then compiling by hardhat to avoid less errors；


```
$ yarn hardhat compile
```

## Deploying contract

```
## Edit deploy/001_deploy_token.ts

## Deploying contract
$ yarn hardhat deploy

```

## Running unit tests

```
$ npx hardhat test
```

## On-Chain Contract Test

```
$ pwd 
.../test_at_fullnode

$ node KanamitTrade.js

...

```


