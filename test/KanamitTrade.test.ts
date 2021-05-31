import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("=======================================k-trade MISC测试===========================", function () {


  it("total supply测试", async function () {

    const [owner, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const KanamitCore = await ftryKCore.deploy();
    await KanamitCore.deployed();

    const ftryKTrade = await ethers.getContractFactory("KanamitTrade");
    const KanamitTrade = await ftryKTrade.deploy(KanamitCore.address);
    await KanamitTrade.deployed();

    const ownerBalance = await KanamitTrade.balanceOf(owner.getAddress());
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
    console.log('deployer', await deployer.getAddress(), 'user0', await user0.getAddress(), 'user1', await user1.getAddress(), 'user2', await user2.getAddress());

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


    console.log('--------------coreCreateAsset---------------');

    //只允许k-trade的owner调用coreCreateAsset
    //  以下注释放开会报错
    // await KanamitTrade.connect(user0).coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");


    //创建事件
    let prmCreate = new Promise((resolve, reject) => {
      KanamitTrade.on('EventCreate', (owner, uri, assetId) => {

        resolve({
          owner: owner,
          uri: uri,
          assetId: assetId
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });

    //调用k-trade内置的k-core合约
    await KanamitTrade.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");

    let eventCreate = await prmCreate;
    console.log("owner", eventCreate["owner"]);
    console.log("uri", eventCreate["uri"]);
    console.log("assetId", eventCreate["assetId"]);

    await KanamitTrade.coreGetAssetById(index++).then(function (assetHash) {
      console.log('assetHash', assetHash);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

    let uri = "https://twitter.com/zhoushx1018/status/1394366048300720130";
    await KanamitTrade.getAsset(uri).then(function (result) {
      console.log('found', result['found']);
      console.log('assetId', result['assetId']);
      console.log('addrOwner', result['addrOwner']);
    })

    await KanamitTrade.coreCreateAsset(user0.getAddress(), uri);

    await KanamitTrade.coreGetAssetId(uri).then(function (assetId) {
      console.log('assetId', assetId);
    })

    await KanamitTrade.getAsset(uri).then(function (result) {
      console.log('found', result['found']);
      console.log('assetId', result['assetId']);
      console.log('addrOwner', result['addrOwner']);
    })

    await KanamitTrade.getUriOwner(uri).then(function (addrOwner) {
      console.log('addrOwner', addrOwner);
    })

    await KanamitTrade.coreGetUriOwner(uri).then(function (addressOwner) {
      console.log("addressOwner", addressOwner);
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

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
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

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
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


    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    await ethers.provider.getBalance(user1.getAddress()).then(function (user1_Balance) {
      console.log('eth_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });;

    await ethers.provider.getBalance(user2.getAddress()).then(function (user2_Balance) {
      console.log('eth_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });;

    await ethers.provider.getBalance(user3.getAddress()).then(function (user3_Balance) {
      console.log('eth_user3_Balance', ethers.utils.formatEther(user3_Balance));
    });;


    //创建事件
    let prmBid = new Promise((resolve, reject) => {
      KanamitTrade.on('EventBid', (bidder, amount, reqId) => {
        resolve({
          bidder: bidder,
          amount: amount,
          reqId: reqId
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });


    //-------------------bid 1-------------
    console.log('--------------bid 1---------------');
    let reqId = 1001;
    await KanamitTrade.connect(user3).bid(reqId, uri, { value: ethers.utils.parseEther("12") });

    await KanamitTrade.balanceOf(user0.getAddress()).then(function (user0_Balance) {
      console.log('ktm_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (ownerBalance) {
      console.log('ktm_owner_Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (deployerBalance) {
      console.log('ktm_deployer_Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.balanceOf(KanamitTrade.address).then(function (kTrade_Balance) {
      console.log('ktm_kTrade_Balance', ethers.utils.formatEther(kTrade_Balance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer.getAddress()).then(function (deployerBalance) {
      console.log('eth_Deployer_Balance', ethers.utils.formatEther(deployerBalance));
    });;


    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    await ethers.provider.getBalance(user1.getAddress()).then(function (user1_Balance) {
      console.log('eth_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });;

    await ethers.provider.getBalance(user2.getAddress()).then(function (user2_Balance) {
      console.log('eth_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });;

    await ethers.provider.getBalance(user3.getAddress()).then(function (user3_Balance) {
      console.log('eth_user3_Balance', ethers.utils.formatEther(user3_Balance));
    });;

    let eventBid = await prmBid;
    // console.log("eventBid", eventBid);
    console.log("bidder", eventBid["bidder"]);
    console.log("amount", ethers.utils.formatEther(eventBid["amount"]));
    console.log("reqId", eventBid["reqId"].toNumber());

    // //-------------------bid 2------------
    reqId++;
    await KanamitTrade.connect(user1).bid(reqId, uri, { value: ethers.utils.parseEther("13") });

    await KanamitTrade.balanceOf(user1.getAddress()).then(function (user1_Balance) {
      console.log('ktm_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (ownerBalance) {
      console.log('ktm_owner_Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (deployerBalance) {
      console.log('ktm_deployer_Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.balanceOf(KanamitTrade.address).then(function (kTrade_Balance) {
      console.log('ktm_kTrade_Balance', ethers.utils.formatEther(kTrade_Balance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer.getAddress()).then(function (deployerBalance) {
      console.log('eth_Deployer_Balance', ethers.utils.formatEther(deployerBalance));
    });;


    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    await ethers.provider.getBalance(user1.getAddress()).then(function (user1_Balance) {
      console.log('eth_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });;

    await ethers.provider.getBalance(user2.getAddress()).then(function (user2_Balance) {
      console.log('eth_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });;

    await ethers.provider.getBalance(user3.getAddress()).then(function (user3_Balance) {
      console.log('eth_user3_Balance', ethers.utils.formatEther(user3_Balance));
    });;



    // //-------------------bid 3------------
    reqId++;
    await KanamitTrade.connect(user2).bid(reqId, uri, { value: ethers.utils.parseEther("15") });

    await KanamitTrade.balanceOf(user2.getAddress()).then(function (user2_Balance) {
      console.log('ktm_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (ownerBalance) {
      console.log('ktm_owner_Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer.getAddress()).then(function (deployerBalance) {
      console.log('ktm_deployer_Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.balanceOf(KanamitTrade.address).then(function (kTrade_Balance) {
      console.log('ktm_kTrade_Balance', ethers.utils.formatEther(kTrade_Balance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm_supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer.getAddress()).then(function (deployerBalance) {
      console.log('eth_Deployer_Balance', ethers.utils.formatEther(deployerBalance));
    });;


    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    await ethers.provider.getBalance(user1.getAddress()).then(function (user1_Balance) {
      console.log('eth_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });;

    await ethers.provider.getBalance(user2.getAddress()).then(function (user2_Balance) {
      console.log('eth_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });;

    await ethers.provider.getBalance(user3.getAddress()).then(function (user3_Balance) {
      console.log('eth_user3_Balance', ethers.utils.formatEther(user3_Balance));
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

    //-------------------getCurrentAuctionStatus------------    
    await KanamitTrade.getCurrentAuctionStatus(uri).then(function (result) {
      // console.log('result', result);

      //uri拍卖已存在，auctionId不能为0
      expect(result.auctionId).not.to.equal(0);
    });

    await KanamitTrade.getCurrentAuctionStatus("https://foo.bar.org").then(function (result) {
      // console.log('result', result);

      //uri拍卖不存在，auctionId为0
      expect(result.auctionId).to.equal(0);
    });

    //uri判断
    //  以下注释打开会报错，因为 uri没有mint过
    // await KanamitTrade.accept("https://foo.bar.org").then(function (result) {
    // });

    //owner判断
    //  以下注释打开会报错，因为 owner不是 k-trade合约地址
    // await KanamitTrade.accept(uri, 100).then(function (result) {
    // });

    //创建事件
    let prmAccept = new Promise((resolve, reject) => {
      KanamitTrade.on('EventAccept', (winner, amount, success) => {

        resolve({
          winner: winner,
          amount: amount,
          success: success
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });



    await KanamitTrade.coreGetUriOwner(uri).then(function (addressOwner) {
      console.log("addressOwner", addressOwner);
    });


    await KanamitTrade.coreGetAssetId(uri).then(function (assetId) {
      console.log("assetId", assetId.toNumber());
    });

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    await ethers.provider.getBalance(user1.getAddress()).then(function (user1_Balance) {
      console.log('eth_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });;

    await ethers.provider.getBalance(user2.getAddress()).then(function (user2_Balance) {
      console.log('eth_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });;

    await ethers.provider.getBalance(user3.getAddress()).then(function (user3_Balance) {
      console.log('eth_user3_Balance', ethers.utils.formatEther(user3_Balance));
    });;

    await KanamitTrade.getCurrentAuctionStatus(uri).then(function (result) {
      console.log('result', result);
    });

    console.log('--------------accept---------------');

    await KanamitTrade.connect(user0).accept(uri, ethers.utils.parseEther("15")).then(function (result) {
    });

    await KanamitTrade.getCurrentAuctionStatus(uri).then(function (result) {
      console.log('result', result);
    });

    let eventAccept = await prmAccept;
    // console.log("eventAccept", eventAccept);
    console.log("winner", eventAccept["winner"]);
    // console.log("amount", eventAccept["amount"]);
    console.log("amount", ethers.utils.formatEther(eventAccept["amount"]));
    console.log("success", eventAccept["success"]);

    await KanamitTrade.coreGetUriOwner(uri).then(function (addressOwner) {
      console.log("addressOwner", addressOwner);
    });

    await KanamitTrade.coreGetAssetId(uri).then(function (assetId) {
      console.log("assetId", assetId.toNumber());
    });

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });;

    await ethers.provider.getBalance(user1.getAddress()).then(function (user1_Balance) {
      console.log('eth_user1_Balance', ethers.utils.formatEther(user1_Balance));
    });;

    await ethers.provider.getBalance(user2.getAddress()).then(function (user2_Balance) {
      console.log('eth_user2_Balance', ethers.utils.formatEther(user2_Balance));
    });;

    await ethers.provider.getBalance(user3.getAddress()).then(function (user3_Balance) {
      console.log('eth_user3_Balance', ethers.utils.formatEther(user3_Balance));
    });;


  });



  it("event filter测试", async function () {
    const [deployer, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const KanamitCore = await ftryKCore.deploy();
    const instKanamitCore = await ftryKCore.attach(KanamitCore.address);
    await KanamitCore.deployed();

    const ftryKTrade = await ethers.getContractFactory("KanamitTrade");
    const KanamitTrade = await ftryKTrade.deploy(KanamitCore.address);
    await KanamitTrade.deployed();
    const instKanamitTrade = await ftryKTrade.attach(KanamitTrade.address);


    //地址列表
    console.log('KanamitCore', KanamitCore.address, 'KanamitTrade', KanamitTrade.address);
    console.log('deployer', await deployer.getAddress(), 'user0', await user0.getAddress(), 'user1', await user1.getAddress(), 'user2', await user2.getAddress());

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


    console.log('--------------event filter---------------');

    //创建事件
    let prmCreate = new Promise((resolve, reject) => {
      KanamitTrade.on('EventCreate', (owner, uri, assetId) => {

        resolve({
          owner: owner,
          uri: uri,
          assetId: assetId
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });

    // let filter = {
    //   address: instKanamitTrade.address,
    //   topics: [
    //     // the name of the event, parnetheses containing the data type of each event, no spaces
    //     ethers.utils.id("EventCreate(owner,uri,assetId)")
    //   ]
    // }

    
    // ethers.provider.on(filter, (owner, uri, assetId) => {
    //   console.log("owner", owner);
    //   console.log("uri", uri);
    //   console.log("assetId", assetId);
    // }
    // );

    //调用k-trade内置的k-core合约
    // let filter = await instKanamitTrade.filters.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");
    await instKanamitTrade.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");


    let eventCreate = await prmCreate;
    console.log("owner", eventCreate["owner"]);
    console.log("uri", eventCreate["uri"]);
    console.log("assetId", eventCreate["assetId"]);



    // let filter = KanamitTrade.coreCreateAsset(user0.getAddress(), null, null);

    // await KanamitTrade.on('EventCreate', (owner, uri, assetId) => {
    //   console.log("owner", owner);
    //   console.log("uri", uri);
    //   console.log("assetId", assetId);
    // });

    // console.log("filter", filter);
    // await KanamitTrade.on(filter, (owner, uri, assetId) => {
    //   console.log("owner", owner);
    //   console.log("uri", uri);
    //   console.log("assetId", assetId);
    // });

    // //调用k-trade内置的k-core合约
    // // let filter = await instKanamitTrade.filters.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124614");
    // filter = await instKanamitTrade.coreCreateAsset(user0.getAddress(), "https://twitter.com/zhoushx1018/status/1385995589117124615");
    // console.log("filter", filter);
    // await KanamitTrade.on(filter, (owner, uri, assetId) => {
    //   console.log("owner", owner);
    //   console.log("uri", uri);
    //   console.log("assetId", assetId);
    // });



  });




});


