let moment = require('moment');
let Web3 = require('web3');
let ethers = require('ethers');

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

//@brief getWeb3Contract
//@param fileName，（带相对路径的）文件名
//@param address 合约地址
function getWeb3Contract(fileName, address) {
    let jsonArtifact = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    let contractObj = new web3.eth.Contract(jsonArtifact.abi, address);
    return contractObj
}

//@brief getEthersContract
//@param fileName，（带相对路径的）文件名
//@param address 合约地址
function getEthersContract(fileName, address, provider) {
    let jsonArtifact = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    let contractObj = new ethers.Contract(address, jsonArtifact.abi, provider);
    return contractObj
}

let trade = async time => {
    // let contractKTrade = getWeb3Contract('../artifacts/contracts/KanamitTrade.sol/KanamitTrade.json',     addrKTrade);

    //不带signer的合约对象
    let addrKTrade = '0x4bdfd174449b46eb69a27ad457f69c53f39df1e2';
    let provider = new ethers.providers.Web3Provider(web3.currentProvider);
    let contractKTrade = getEthersContract('../artifacts/contracts/KanamitTrade.sol/KanamitTrade.json', addrKTrade, provider);
    // console.log(moment().format("YYYYMMDD HH:mm:ss"), 'DEBUG', 'contractKTrade', contractKTrade);

    let uri = 'ybRA5tc_bdQ';
    let retBids = await contractKTrade.getBids(uri, 0);
    console.log('retBids', retBids);

    //带signer的合约对象
    let privateKey = '1db2a83a84f83917c10a51141d78b91756e0414e402a5e4c4d94dcdc3074c150';
    let walletOwner = new ethers.Wallet(privateKey, provider);
    let contractKTradeWithSigner = contractKTrade.connect(walletOwner);

    retBids = await contractKTradeWithSigner.getBids(uri, 0);
    console.log('retBids', retBids);

    // //accept
    // await contractKTradeWithSigner.accept(uri, 400000000000000, {
    //     gasLimit: 250000
    // });
    // console.log('accept exec ok');
}


let test = async time => {
    await trade()
}

test()