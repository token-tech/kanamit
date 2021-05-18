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
});
