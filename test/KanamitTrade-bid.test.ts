import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("=======================================k-trade bid测试===========================", function () {

    

  it("拍卖测试--ReqId判重", async function () {
    const [deployer, user0, user1, user2, user3] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const KanamitCore = await ftryKCore.deploy();
    await KanamitCore.deployed();

    const ftryKTrade = await ethers.getContractFactory("KanamitTrade");
    const KanamitTrade = await ftryKTrade.deploy(KanamitCore.address);
    await KanamitTrade.deployed();

    //地址列表
    console.log('KanamitCore', KanamitCore.address, 'KanamitTrade', KanamitTrade.address);
    console.log('deployer', await deployer.getAddress(), 'user0', await user0.getAddress(), 'user1', await user1.getAddress(), 'user2', await user2.getAddress(), 'user3', await user3.getAddress());

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    //直接转移owner
    //  k-core直接转移owner；从创建地址，转到k-trade合约
    console.log('k-core owner', await KanamitCore.owner());
    expect(await KanamitCore.owner()).to.equal(await deployer.getAddress());

    await KanamitCore.connect(deployer).transferOwnership(KanamitTrade.address);

    //-------------------mint -------------
    let uri = "https://twitter.com/zhoushx1018/status/1385995589117124614"
    await KanamitTrade.coreCreateAsset(user0.getAddress(), uri);

    let assertId = await KanamitTrade.coreGetAssetId(uri);
    console.log('assertId', assertId.toNumber());

    //--------------------bid 和 accept -------------------
    //以下注释，是 reqId 判重测试
    //  如果智能合约没有做 reqId 判重，则accept 极有可能报错
    //  如果智能合约做了 reqId 判重， 则 bid 就直接报错
   
    let reqId = 1001;
    await KanamitTrade.connect(user3).bid(reqId, uri, { value: ethers.utils.parseEther("12") });

    reqId++;
    await KanamitTrade.connect(user3).bid(reqId, uri, { value: ethers.utils.parseEther("13") });
   
    reqId++;
    await KanamitTrade.connect(user3).bid(reqId, uri, { value: ethers.utils.parseEther("15") });

    await KanamitTrade.connect(user0).accept(uri, ethers.utils.parseEther("15")).then(function (result) {
    });

  });

});


