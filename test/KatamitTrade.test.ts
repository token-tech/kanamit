import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("=======================================k-trade MISC测试===========================", function () {


  it("total supply测试", async function () {
    await deployments.fixture(["KanamitTrade"]);
    const { tokenOwner, user0 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");
    const ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    const supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);
  });


  it("owner权限测试", async function () {
    const [owner, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const KanamitCore = await ftryKCore.deploy();
    await KanamitCore.deployed();

    const ftryKTrade = await ethers.getContractFactory("KanamitTrade");
    const KanamitTrade = await ftryKTrade.deploy(KanamitCore.address);
    await KanamitTrade.deployed();

    //0值地址校验；放开以下注释，会触发合约的0值地址校验，报错
    // await KanamitTrade.setCoreAddress(ethers.constants.AddressZero);

    //owner权限测试
    await KanamitTrade.setCoreAddress(KanamitCore.address);

    //owner权限测试；放开以下注释，会触发合约的owner校验，报错
    // await KanamitTrade.connect(user0).setCoreAddress(KanamitCore.address);

  });


  it("内置core合约调用测试", async function () {
    const [deployer, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const KanamitCore = await ftryKCore.deploy();
    await KanamitCore.deployed();

    const ftryKTrade = await ethers.getContractFactory("KanamitTrade");
    const KanamitTrade = await ftryKTrade.deploy(KanamitCore.address);
    await KanamitTrade.deployed();


    //地址列表
    console.log('KanamitCore', KanamitCore.address, 'KanamitTrade', KanamitTrade.address);
    console.log('deployer', await deployer.getAddress(), 'user0', await user0.getAddress(), 'user1', await user1.getAddress());

    await KanamitTrade.coreAddress().then(function (coreAddress) {
      console.log('coreAddress', coreAddress);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

    let index = 0;

    //直接转移owner
    //  k-core直接转移owner；从创建地址，转到k-trade合约
    console.log('k-core owner', await KanamitCore.owner());
    expect(await KanamitCore.owner()).to.equal(await deployer.getAddress());

    await KanamitCore.connect(deployer).transferOwnership(KanamitTrade.address);

    console.log('k-core owner', await KanamitCore.owner());
    expect(await KanamitCore.owner()).to.equal(KanamitTrade.address);

    //间接转移owner
    //  k-tade在内部，把k-core的owner 从this（k-trade）转移为 user0
    console.log('k-trade owner', await KanamitTrade.owner());
    await KanamitTrade.coreTransferOwnership(user0.getAddress());

    console.log('k-core owner', await KanamitCore.owner());
    expect(await KanamitCore.owner()).to.equal(await user0.getAddress());

    //直接转移owner
    //  k-core直接转移owner；从user0，转到k-trade合约
    await KanamitCore.connect(user0).transferOwnership(KanamitTrade.address);

    console.log('k-core owner', await KanamitCore.owner());
    expect(await KanamitCore.owner()).to.equal(KanamitTrade.address);

    //只允许k-trade的owner调用coreCreateAsset
    //  以下注释放开会报错
    // await KanamitTrade.connect(user0).coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");

    //调用k-trade内置的k-core合约
    await KanamitTrade.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");

    await KanamitTrade.coreGetAssetById(index++).then(function (assetHash) {
      console.log('assetHash', assetHash);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

    await KanamitTrade.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1394366048300720130");

    await KanamitTrade.coreGetAssetById(index++).then(function (assetHash) {
      console.log('assetHash', assetHash);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

  });

  it("转币测试", async function () {
    const [deployer, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const KanamitCore = await ftryKCore.deploy();
    await KanamitCore.deployed();

    const ftryKTrade = await ethers.getContractFactory("KanamitTrade");
    const KanamitTrade = await ftryKTrade.deploy(KanamitCore.address);
    await KanamitTrade.deployed();

    let ownerBalance = await KanamitTrade.balanceOf(deployer.getAddress());
    let supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);

    //deposit
    KanamitTrade.deposit({ value: ethers.utils.parseEther("11.2") });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (deployer_Balance) {
      console.log('ktm_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
      expect("11.2").to.equal(ethers.utils.formatEther(deployer_Balance));
    });

    await KanamitTrade.balanceOf(user0.getAddress()).then(function (user0_Balance) {
      console.log('ktm_user0_Balance', ethers.utils.formatEther(user0_Balance));
      expect("0.0").to.equal(ethers.utils.formatEther(user0_Balance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
      expect("11.2").to.equal(ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer.getAddress()).then(function (deployer_Balance) {
      console.log('eth_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
    });;

    //deposit
    KanamitTrade.connect(user0).deposit({ value: ethers.utils.parseEther("22.3") });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (deployer_Balance) {
      console.log('ktm_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
      expect("11.2").to.equal(ethers.utils.formatEther(deployer_Balance));
    });

    await KanamitTrade.balanceOf(user0.getAddress()).then(function (user0_Balance) {
      console.log('ktm_user0_Balance', ethers.utils.formatEther(user0_Balance));
      expect("22.3").to.equal(ethers.utils.formatEther(user0_Balance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
      expect("33.5").to.equal(ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer.getAddress()).then(function (deployer_Balance) {
      console.log('eth_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
    });;

    //withdraw
    KanamitTrade.connect(user0).withdraw(ethers.utils.parseEther("0.2"));

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (deployer_Balance) {
      console.log('ktm_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
      expect("11.2").to.equal(ethers.utils.formatEther(deployer_Balance));
    });

    await KanamitTrade.balanceOf(user0.getAddress()).then(function (user0_Balance) {
      console.log('ktm_user0_Balance', ethers.utils.formatEther(user0_Balance));
      expect("22.1").to.equal(ethers.utils.formatEther(user0_Balance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
      expect("33.3").to.equal(ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer.getAddress()).then(function (deployer_Balance) {
      console.log('eth_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
    });;
  });


  it("拍卖测试", async function () {
    await deployments.fixture(["KanamitTrade"]);
    const { tokenOwner, deployer, user0, user1 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");
    let ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    let supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);

    //-------------------bid 1-------------
    let reqId = 1001;
    let uri = "https://twitter.com/zhoushx1018/status/1385995589117124614"
    await KanamitTrade.bid(reqId, uri, user0, { value: ethers.utils.parseEther("12") });

    await KanamitTrade.balanceOf(user0).then(function (user0Balance) {
      console.log('ktm_user0-Balance', ethers.utils.formatEther(user0Balance));
    });

    await KanamitTrade.balanceOf(tokenOwner).then(function (ownerBalance) {
      console.log('ktm_owner-Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer).then(function (deployerBalance) {
      console.log('ktm_deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer).then(function (deployerBalance) {
      console.log('eth_Deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });;


    //-------------------bid 2------------
    reqId++;
    await KanamitTrade.bid(reqId, uri, user1, { value: ethers.utils.parseEther("13") });

    await KanamitTrade.balanceOf(user1).then(function (user1Balance) {
      console.log('ktm_user1-Balance', ethers.utils.formatEther(user1Balance));
    });

    await KanamitTrade.balanceOf(tokenOwner).then(function (ownerBalance) {
      console.log('ktm_owner-Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer).then(function (deployerBalance) {
      console.log('ktm_deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer).then(function (deployerBalance) {
      console.log('eth_Deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });;

    //-------------------getBids------------    
    await KanamitTrade.getBids(uri, 0).then(function (result) {

      function printArrayNumber(array, arrName) {
        console.log('ArrayNumber', arrName, 'len', array.length);
        for (let i = 0; i < array.length; i++) {
          console.log('element', array[i].toNumber());
        }
      }

      function printArrayAddress(array, arrName) {
        console.log('ArrayNumber', arrName, 'len', array.length);
        for (let i = 0; i < array.length; i++) {
          console.log('element', array[i].toString());
        }
      }

      function printArrayEther(array, arrName) {
        console.log('ArrayEther', arrName, 'len', array.length);
        for (let i = 0; i < array.length; i++) {
          console.log('element', ethers.utils.formatEther(array[i]));
        }
      }

      function printArrayRaw(array, arrName) {
        console.log('ArrayNumber', arrName, 'len', array.length);
        for (let i = 0; i < array.length; i++) {
          console.log('element', array[i]);
        }
      }

      console.log('auctionId', result.auctionId.toNumber());
      console.log('totalBids', result.totalBids.toNumber());

      printArrayNumber(result.bidIds, "bidIds");
      printArrayNumber(result.reqIds, "reqIds");
      printArrayAddress(result.addressBidders, "addressBidders");
      printArrayEther(result.amounts, "amounts");
      printArrayRaw(result.cancels, "cancels");
    });

    //-------------------getAuctionStatus------------    
    await KanamitTrade.getAuctionStatus(uri).then(function (result) {
      console.log('result', result);

      //uri拍卖已存在，auctionId不能为0
      expect(result.auctionId).not.to.equal(0);
    });

    await KanamitTrade.getAuctionStatus("https://foo.bar.org").then(function (result) {
      console.log('result', result);

      //uri拍卖不存在，auctionId为0
      expect(result.auctionId).to.equal(0);
    });

    await KanamitTrade.accept(uri).then(function (result) {
    });

    // await KanamitTrade.accept("https://foo.bar.org").then(function (result) {
    // });

  });

});


