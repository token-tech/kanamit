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
    const { deployer, tokenOwner, user0 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");

    //地址列表
    console.log('deployer', deployer, 'tokenOwner', tokenOwner, 'user0', user0);

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
    const { tokenOwner, user0 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");
    let ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    let supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);

    // KanamitTrade.deposit({value: 100000000000});
    KanamitTrade.deposit({ value: ethers.utils.parseEther("0.0000012345") });

    const user0Balance = await KanamitTrade.balanceOf(user0);
    console.log('user0Balance', user0Balance.toNumber());

    ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    console.log('ownerBalance', ownerBalance.toNumber());

    supply = await KanamitTrade.totalSupply();
    console.log('supply', supply.toNumber());

  });

});


