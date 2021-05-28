let moment = require('moment');
let Web3 = require('web3');

// 币安链--测试网
let web3 = new Web3(new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545"));

// // 币安链--主网
// // let web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org"));
let fs = require('fs');

// BSC(Binance Sart Chain)
//  主网参数
//      RPC URL: https://bsc-dataseed.binance.org/
//      ChainID: 56
//      Symbol: BNB
//      浏览器 URL: https://bscscan.com
//
// 测试网参数// 
//      RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
//      ChainID: 97
//      Symbol: BNB
//      浏览器 URL: https://testnet.bscscan.com

//@brief getContract
//@param fileName，（带相对路径的）文件名
//@param address 合约地址
function getContract(fileName, address) {
    let jsonArtifact = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    let contractObj = new web3.eth.Contract(jsonArtifact.abi, address);
    return contractObj
}

let getFactoryAllPair = async time => {    
    let addrKTrade = '0xa75809ade22c37b0d53706edd7c3c83bb9dee8d4';    //v2-factory@BNB mainnet

    let contractKTrade = getContract('../artifacts/contracts/KanamitTrade.sol/KanamitTrade.json',
        addrKTrade);
    // console.log('contractKTrade', contractKTrade);    
    console.log(moment().format("YYYYMMDD HH:mm:ss"), 'DEBUG', 'contractKTrade', contractKTrade)

//     let allPairsLength = await contractKTrade.methods.allPairsLength().call();
//     console.log('allPairsLength', allPairsLength);

//     for (let i = 0; i < allPairsLength; i++) {
//         let currPairAddr = await contractKTrade.methods.allPairs(i).call();
//         console.log('currPairAddr', currPairAddr);

//         let currContractPair = getContract('./artifacts/contracts/UniswapV2Factory.sol/UniswapV2Pair.json',
//             currPairAddr);

//         let currSymbol = await currContractPair.methods.symbol().call();
//         console.log('currSymbol', currSymbol);

//         let token0 = await currContractPair.methods.token0().call();
//         let token1 = await currContractPair.methods.token1().call();
//         console.log('token0', token0, 'token1', token1);
        

//         let currReserves = await currContractPair.methods.getReserves().call();
//         console.log('currReserves', currReserves);
        
//     }

}


let test = async time => {
    await getFactoryAllPair()
}

test()