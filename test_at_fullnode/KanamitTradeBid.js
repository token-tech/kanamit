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


let tradeBid = async time => {
    //带signer的合约对象
    let provider = new ethers.providers.Web3Provider(web3.currentProvider);
    let addrKTrade = '0xefFC370714C879d59d68D19484C616eC21Ee0EcA';
    let privateKey = 'b8bc5402eef3232cc1adea9a12b0b2c463e02f2b137278d60afb4b00862926ba';  //地址 0x1C5d5AC9EB0830680690FC32B1ac9F098FCaeFBA
    // let privateKey = '08a013f17125aadd0b5a8f39de0d66a62877e010589d503b336a1d6b51093ea9'; //对应地址 0xcb329f9e0867bfde7e3adba300c8042e38e86587
    let walletOwner = new ethers.Wallet(privateKey, provider);

    let contractKTrade = getEthersContract('../artifacts/contracts/KanamitTrade.sol/KanamitTrade.json', addrKTrade, provider);
    let contractKTradeWithSigner = contractKTrade.connect(walletOwner);

    //bid
    let reqId = 9911;
    let uri = 'r6mAsRVAUaN';
    await contractKTradeWithSigner.bid(reqId, uri, { value: ethers.utils.parseEther("0.0002"), gasLimit: 250000 });

    let filter = contractKTradeWithSigner.filters.EventBid(walletOwner.address, null, null);
    await contractKTradeWithSigner.on(filter, (addrSender, amount, reqId) => {
        console.log('addrSender', addrSender, 'amount', ethers.utils.formatEther(amount), 'reqId', reqId.toNumber());
    });

}


let test = async time => {
    await tradeBid()
}

test()