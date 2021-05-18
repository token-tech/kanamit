import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("total supply", function () {
  it("total supply相关测试", async function () {
    await deployments.fixture(["KanamitCore"]);
    const { tokenOwner } = await getNamedAccounts();
    const kanamitCore = await ethers.getContract("KanamitCore");
    const ownerBalance = await kanamitCore.balanceOf(tokenOwner);
    const supply = await kanamitCore.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance).to.equal(supply);
  });
});


describe("create asset", function () {
  it("创建资产", async function () {
    await deployments.fixture(["KanamitCore"]);
    const { user0, tokenOwner } = await getNamedAccounts();
    const kanamitCore = await ethers.getContract("KanamitCore");

    let ownerBalance = await kanamitCore.balanceOf(tokenOwner);
    let user0Balance = await kanamitCore.balanceOf(user0);
    let supply = await kanamitCore.totalSupply();
    let iCount = 0;

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('user0Balance', user0Balance.toNumber());
    console.log('supply', supply.toNumber());

    //---------创建新的NFT--------------------------
    let prmCreate = new Promise((resolve, reject) => {
      kanamitCore.on('Create', (owner, AssetId, assetHash, uri) => {

        resolve({
          owner: owner,
          AssetId: AssetId,
          assetHash: assetHash,
          uri: uri
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });

    let assetObject = await kanamitCore.createAsset(user0, "https://twitter.com/zhoushx1018/status/1385995589117124614");
    let eventCreate = await prmCreate;
    console.log("eventCreate", eventCreate);
    console.log("AssetId", eventCreate["AssetId"].toNumber());
    console.log("assetHash", ethers.BigNumber.from(eventCreate["assetHash"]).toHexString());

    ownerBalance = await kanamitCore.balanceOf(tokenOwner);
    user0Balance = await kanamitCore.balanceOf(user0);
    supply = await kanamitCore.totalSupply();
    
    //NFT总量验证
    expect(supply).to.equal(++iCount);

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('user0Balance', user0Balance.toNumber());
    console.log('supply', supply.toNumber());

    //根据AssetId验证NFT
    let currAssetHash = await kanamitCore.getAsset(iCount-1);
    expect(currAssetHash).to.equal(eventCreate["assetHash"]);

    console.log("currAssetHash", ethers.BigNumber.from(currAssetHash).toHexString());

    //---------创建新的NFT--------------------------
    prmCreate = new Promise((resolve, reject) => {
      kanamitCore.on('Create', (owner, AssetId, assetHash, uri) => {

        resolve({
          owner: owner,
          AssetId: AssetId,
          assetHash: assetHash,
          uri: uri
        });
      });

      setTimeout(() => {
        reject(new Error('timeout'));
      }, 600000)
    });

    let nftId1 = await kanamitCore.createAsset(user0, "https://twitter.com/zhoushx1018/status/1394366048300720130");
    eventCreate = await prmCreate;
    console.log("eventCreate", eventCreate);
    console.log("AssetId", eventCreate["AssetId"].toNumber());
    console.log("assetHash", ethers.BigNumber.from(eventCreate["assetHash"]).toHexString());

    ownerBalance = await kanamitCore.balanceOf(tokenOwner);
    user0Balance = await kanamitCore.balanceOf(user0);
    supply = await kanamitCore.totalSupply();
    
    //NFT总量验证
    expect(supply).to.equal(++iCount);

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('user0Balance', user0Balance.toNumber());
    console.log('supply', supply.toNumber());
    
    //根据AssetId验证NFT
    currAssetHash = await kanamitCore.getAsset(iCount-1);
    expect(currAssetHash).to.equal(eventCreate["assetHash"]);

    console.log("currAssetHash", ethers.BigNumber.from(currAssetHash).toHexString());
    
  });
});