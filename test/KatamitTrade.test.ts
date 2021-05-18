import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("total supply", function () {
  it("total supply相关测试", async function () {
    await deployments.fixture(["KanamitTrade"]);
    const { tokenOwner, user0 } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");
    const ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    const supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);

    let coreAddress = await KanamitTrade.coreAddress();
    console.log('coreAddress', coreAddress);

    let coreTotalSupply = await KanamitTrade.coreTotalSupply();
    console.log('coreTotalSupply', coreTotalSupply.toNumber());

    let index = 0;

    await KanamitTrade.coreCreateAsset(user0, "https://twitter.com/zhoushx1018/status/1385995589117124614");

    let assetHash = await KanamitTrade.coreGetAsset(index++);
    coreTotalSupply = await KanamitTrade.coreTotalSupply();

    console.log('assetHash', assetHash);
    console.log('coreTotalSupply', coreTotalSupply.toNumber());    

    await KanamitTrade.coreCreateAsset(user0, "https://twitter.com/zhoushx1018/status/1394366048300720130");

    assetHash = await KanamitTrade.coreGetAsset(index++);
    coreTotalSupply = await KanamitTrade.coreTotalSupply();

    console.log('assetHash', assetHash);
    console.log('coreTotalSupply', coreTotalSupply.toNumber());

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


