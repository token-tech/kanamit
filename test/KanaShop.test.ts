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
    expect(decimalKanaToken).to.equal(await kanaShop.decimalsKana());

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
      // console.log('result', result);

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

    console.log('--------------price---------------');
    //setRawPrice--owner 校验；放开以下注释，会报错    
    // await kanaShop.connect(user1).setRawPrice(ethers.utils.parseUnits("0.00006", decimalKanaToken) ,ethers.utils.parseEther("1"));

    //setRawPrice--兑换比例过高校验，以下注释放开会报错
    // await kanaShop.setRawPrice(ethers.utils.parseUnits("1", decimalKanaToken), ethers.utils.parseEther("1"));

    //setRawPrice
    await kanaShop.setRawPrice(ethers.utils.parseUnits("45000000", decimalKanaToken), ethers.utils.parseEther("1"));

    // getRawPrice
    await kanaShop.getRawPrice().then(function (result) {
      // console.log('result', result);
      console.log('amountKana', ethers.utils.formatUnits(result.amountKana, decimalKanaToken));
      console.log('amountEth', ethers.utils.formatEther(result.amountEth));
    });

    // getRate
    await kanaShop.getRate().then(function (rate) {
      console.log('rate', rate.toNumber());
    });

    console.log('--------------release---------------');

    //创建事件
    let prmRelease = new Promise((resolve, reject) => {
      kanaShop.on('EventRelease', (address, amount) => {

        resolve({
          address: address,
          amount: amount
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });


    //release--owner 校验；放开以下注释，会报错    
    // await kanaShop.connect(user1).release();

    console.log('--------------release---------------');
    //mint
    //  直接mint给 kanaShop，会涉及繁杂且容易出错的 allowance 和 approve
    //  这里先mint给 deployer，再由 deployer 转账给 kanaShop    
    await kanaToken.mint(deployer.getAddress(), ethers.utils.parseUnits("100000000000", decimalKanaToken));
    await kanaToken.connect(deployer).transfer(kanaShop.address, ethers.utils.parseUnits("100000000000", decimalKanaToken));

    await kanaToken.minted().then(function (minted) {
      console.log('minted', ethers.utils.formatUnits(minted, decimalKanaToken));
    });

    await kanaToken.balanceOf(kanaShop.address).then(function (balance) {
      console.log('KANA_kanaShop_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    await kanaToken.balanceOf(user0.getAddress()).then(function (balance) {
      console.log('KANA_user0_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    await kanaToken.balanceOf(user1.getAddress()).then(function (balance) {
      console.log('KANA_user1_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    //release
    await kanaShop.release();

    let eventRelease = await prmRelease;
    // console.log("eventRelease", eventRelease);
    console.log("address", eventRelease["address"]);
    console.log("amount", ethers.utils.formatUnits(eventRelease["amount"], decimalKanaToken));


    // console.log('--------------------getOrdersByAddress--------------------');
    // await kanaShop.getOrdersByAddress(user1.getAddress()).then(function (result) {
    //   // console.log('result', result);

    //   function printArrayNumber(array, arrName) {
    //     console.log('ArrayNumber', arrName, 'len', array.length);
    //     for (let i = 0; i < array.length; i++) {
    //       console.log('element', array[i].toNumber());
    //     }
    //   }

    //   function printArrayAddress(array, arrName) {
    //     console.log('ArrayNumber', arrName, 'len', array.length);
    //     for (let i = 0; i < array.length; i++) {
    //       console.log('element', array[i].toString());
    //     }
    //   }

    //   function printArrayEther(array, arrName) {
    //     console.log('ArrayEther', arrName, 'len', array.length);
    //     for (let i = 0; i < array.length; i++) {
    //       console.log('element', ethers.utils.formatEther(array[i]));
    //     }
    //   }

    //   function printArrayRaw(array, arrName) {
    //     console.log('ArrayNumber', arrName, 'len', array.length);
    //     for (let i = 0; i < array.length; i++) {
    //       console.log('element', array[i]);
    //     }
    //   }

    //   console.log('totalOrders=========', result.totalOrders.toNumber());
    //   printArrayAddress(result.addrUsers, "addrUsers----");
    //   printArrayEther(result.amounts, "amounts-----");
    //   printArrayRaw(result.releases, "releases-----");
    //   printArrayNumber(result.createTimes, "createTimes----");
    //   printArrayNumber(result.updateTimes, "updatetimes---");
    // });

    await kanaToken.balanceOf(kanaShop.address).then(function (balance) {
      console.log('KANA_kanaShop_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    await kanaToken.balanceOf(user0.getAddress()).then(function (balance) {
      console.log('KANA_user0_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    await kanaToken.balanceOf(user1.getAddress()).then(function (balance) {
      console.log('KANA_user1_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    console.log('--------------release again---------------');
    //再次release
    //  应该没有任何需要release的
    await kanaShop.release();

    await kanaToken.balanceOf(kanaShop.address).then(function (balance) {
      console.log('KANA_kanaShop_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    await kanaToken.balanceOf(user0.getAddress()).then(function (balance) {
      console.log('KANA_user0_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

    await kanaToken.balanceOf(user1.getAddress()).then(function (balance) {
      console.log('KANA_user1_Balance', ethers.utils.formatUnits(balance, decimalKanaToken));
    });

  });


});