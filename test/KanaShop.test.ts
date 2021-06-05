import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("=========================== KanaShop MISC ===========================", function () {
  it(" MISC 测试", async function () {
    const [deployer, user0, user1, user2, firstStageAdmin] = await ethers.getSigners();

    const ftryKanaToken = await ethers.getContractFactory("KanaToken");
    const kanaToken = await ftryKanaToken.deploy();
    await kanaToken.deployed();

    const ftryKShop = await ethers.getContractFactory("KanaShop");
    const kanaShop = await ftryKShop.deploy(kanaToken.address);
    await kanaShop.deployed();

    let decimalKanaToken = await kanaToken.decimals();
    let decimalETH = await kanaShop.decimalsETH();

    // //tmpTest
    // await kanaShop.tmpTest().then(function (balance) {
    //   console.log('balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    // });

    // //--------tmpTransfer--------
    // await kanaShop.tmpTransfer(user0.getAddress(), ethers.utils.parseUnits("20", decimalKanaToken));

    console.log('--------------address list---------------');
    //地址列表
    console.log('kanaToken', kanaToken.address, 'kanaShop', kanaShop.address);
    console.log('deployer', await deployer.getAddress(), 'user0', await user0.getAddress(), 'user1', await user1.getAddress(), 'user2', await user2.getAddress());

    console.log('--------------buyKana 1---------------');

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });

    await ethers.provider.getBalance(kanaShop.address).then(function (deployer_Balance) {
      console.log('eth_kanaShop_Balance', ethers.utils.formatEther(deployer_Balance));
    });

    //buykana--购买总量限制；放开以下注释，会报错
    // await kanaShop.connect(user0).buyKana({ value: ethers.utils.parseEther("19.2") });
    // await kanaShop.connect(user0).buyKana({ value: ethers.utils.parseEther("299.2") });

    //buyKana
    await kanaShop.connect(user0).buyKana({ value: ethers.utils.parseEther("9.2") });

    await ethers.provider.getBalance(user0.getAddress()).then(function (user0_Balance) {
      console.log('eth_user0_Balance', ethers.utils.formatEther(user0_Balance));
    });

    await ethers.provider.getBalance(kanaShop.address).then(function (kanaShop_Balance) {
      console.log('eth_kanaShop_Balance', ethers.utils.formatEther(kanaShop_Balance));
    });

    await kanaShop.balanceOf(user0.getAddress()).then(function (balance) {
      console.log('KSHOP-balance', ethers.utils.formatUnits(balance, decimalETH));
    });

    console.log('--------------buyKana 2---------------');    //buyKana
    await kanaShop.connect(user1).buyKana({ value: ethers.utils.parseEther("1.1") });

    console.log('--------------buyKana 3---------------');    //buyKana
    await kanaShop.connect(user1).buyKana({ value: ethers.utils.parseEther("1.2") });

    console.log('--------------buyKana 4---------------');    //buyKana
    await kanaShop.connect(user1).buyKana({ value: ethers.utils.parseEther("1.3") });

    console.log('--------------ownerWithdraw---------------');
    //ownerWithdraw--owner 校验；放开以下注释，会报错    
    // await kanaShop.connect(user0).ownerWithdraw(ethers.utils.parseEther("9.2"));

    // ownerWithdraw--金额 校验；放开以下注释，会报错    
    // await kanaShop.connect(deployer).ownerWithdraw(ethers.utils.parseEther("10009.2"));


    await ethers.provider.getBalance(deployer.address).then(function (deployer_Balance) {
      console.log('eth_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
    });

    //ownerWithdraw
    await kanaShop.connect(deployer).ownerWithdraw(ethers.utils.parseEther("9.2"));

    await ethers.provider.getBalance(kanaShop.address).then(function (kanaShop_Balance) {
      console.log('eth_kanaShop_Balance', ethers.utils.formatEther(kanaShop_Balance));
    });

    await ethers.provider.getBalance(deployer.address).then(function (deployer_Balance) {
      console.log('eth_deployer_Balance', ethers.utils.formatEther(deployer_Balance));
    });

    console.log('--------------------getOrdersByAddress--------------------');
    await kanaShop.getOrdersByAddress(user1.getAddress()).then(function (result) {
      console.log('result', result);

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

      console.log('totalOrders=========', result.totalOrders.toNumber());
      printArrayAddress(result.addrUsers, "addrUsers----");
      printArrayEther(result.amounts, "amounts-----");
      printArrayRaw(result.releases, "releases-----");
      printArrayNumber(result.createTimes, "createTimes----");
      printArrayNumber(result.updateTimes, "updatetimes---");
    });
  });


});