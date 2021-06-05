import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("===========================kanatoken测试===========================", function () {
  it(" MISC 测试", async function () {
    const [deployer, user0, user1, user2] = await ethers.getSigners();

    const ftryKanaToken = await ethers.getContractFactory("KanaToken");
    const kanaToken = await ftryKanaToken.deploy();
    await kanaToken.deployed();

    const ownerBalance = await kanaToken.balanceOf(deployer.getAddress());
    const supply = await kanaToken.totalSupply();

    let decimalKanaToken = await kanaToken.decimals();


    await kanaToken.totalSupply().then(function (totalSupply) {
      console.log('totalSupply', ethers.utils.formatUnits(totalSupply, decimalKanaToken));
    });

    //owner 校验；放开以下注释，会报错
    // await kanaToken.connect(user0).mint(user0.getAddress(), 1000 * 10 ** 8);

    await kanaToken.mint(user0.getAddress(), 1000 * 10 ** 8);
    await kanaToken.mint(user0.getAddress(), ethers.utils.parseUnits("10000000000", decimalKanaToken));

    //发行总量校验；放开以下注释，会报错
    // await kanaToken.mint(user0.getAddress(), ethers.utils.parseUnits("100000000001", decimalKanaToken));

    await kanaToken.minted().then(function (minted) {
      console.log('minted', ethers.utils.formatUnits(minted, decimalKanaToken));
    });

  });


});