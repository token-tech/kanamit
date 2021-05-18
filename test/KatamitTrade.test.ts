import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("total supply", function () {
  it("total supply相关测试", async function () {
    await deployments.fixture(["KanamitTrade"]);
    const { tokenOwner } = await getNamedAccounts();
    const KanamitTrade = await ethers.getContract("KanamitTrade");
    const ownerBalance = await KanamitTrade.balanceOf(tokenOwner);
    const supply = await KanamitTrade.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);
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


 