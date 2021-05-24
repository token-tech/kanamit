import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("total supply", function () {
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

  it("内置core合约调用测试", async function () {
    await deployments.fixture(["KanamitTrade"]);
    const { deployer, tokenOwner, user0, user1 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");

    //地址列表
    console.log('deployer', deployer, 'tokenOwner', tokenOwner, 'user0', user0, 'user1', user1);

    await KanamitTrade.coreAddress().then(function (coreAddress) {
      console.log('coreAddress', coreAddress);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

    let index = 0;

    await KanamitTrade.coreCreateAsset(user0, "https://twitter.com/zhoushx1018/status/1385995589117124614");

    await KanamitTrade.coreGetAssetById(index++).then(function (assetHash) {
      console.log('assetHash', assetHash);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

    await KanamitTrade.coreCreateAsset(user0, "https://twitter.com/zhoushx1018/status/1394366048300720130");

    await KanamitTrade.coreGetAssetById(index++).then(function (assetHash) {
      console.log('assetHash', assetHash);
    });

    await KanamitTrade.coreTotalSupply().then(function (coreTotalSupply) {
      console.log('coreTotalSupply', coreTotalSupply);
    });

    await KanamitTrade.setCoreAddress(user0);

    await KanamitTrade.coreAddress().then(function (coreAddress) {
      console.log('coreAddress', coreAddress);
    });

    await KanamitTrade.setCoreAddress(tokenOwner);

    await KanamitTrade.coreAddress().then(function (coreAddress) {
      console.log('coreAddress', coreAddress);
    });

    await KanamitTrade.owner().then(function (ownerAddress) {
      console.log('ownerAddress', ownerAddress);
    }
    );

  });

  it("转币测试", async function () {
    await deployments.fixture(["KanamitTrade"]);
    const { tokenOwner, deployer, user0, user1 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");
    let ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    let supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);

    //deposit
    KanamitTrade.deposit({ value: ethers.utils.parseEther("1.2345678") });

    const user0Balance = await KanamitTrade.balanceOf(user0);
    console.log('ktm-user0Balance', user0Balance.toNumber());

    ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    console.log('ktm-ownerBalance', ownerBalance.toNumber());

    await KanamitTrade.balanceOf(deployer).then(function (deployerBalance) {
      console.log('ktm-deployerBalance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm-supply', ethers.utils.formatEther(supply));
    });


    await ethers.provider.getBalance(deployer).then(function (deployerBalance) {
      console.log('eth-DeployerBalance', ethers.utils.formatEther(deployerBalance));
    });;

    //withdraw
    KanamitTrade.withdraw(ethers.utils.parseEther("0.2"));

    await KanamitTrade.balanceOf(deployer).then(function (deployerBalance) {
      console.log('ktm-deployerBalance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm-supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer).then(function (deployerBalance) {
      console.log('eth-DeployerBalance', ethers.utils.formatEther(deployerBalance));
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
      console.log('ktm-user0-Balance', ethers.utils.formatEther(user0Balance));
    });

    await KanamitTrade.balanceOf(tokenOwner).then(function (ownerBalance) {
      console.log('ktm-owner-Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer).then(function (deployerBalance) {
      console.log('ktm-deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm-supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer).then(function (deployerBalance) {
      console.log('eth-Deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });;


    //-------------------bid 2------------
    reqId++;
    await KanamitTrade.bid(reqId, uri, user1, { value: ethers.utils.parseEther("13") });

    await KanamitTrade.balanceOf(user1).then(function (user1Balance) {
      console.log('ktm-user1-Balance', ethers.utils.formatEther(user1Balance));
    });

    await KanamitTrade.balanceOf(tokenOwner).then(function (ownerBalance) {
      console.log('ktm-owner-Balance', ethers.utils.formatEther(ownerBalance));
    });

    await KanamitTrade.balanceOf(deployer).then(function (deployerBalance) {
      console.log('ktm-deployer-Balance', ethers.utils.formatEther(deployerBalance));
    });

    await KanamitTrade.totalSupply().then(function (supply) {
      console.log('ktm-supply', ethers.utils.formatEther(supply));
    });

    await ethers.provider.getBalance(deployer).then(function (deployerBalance) {
      console.log('eth-Deployer-Balance', ethers.utils.formatEther(deployerBalance));
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

  });

});


