import { expect } from "./chai-setup";

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe("=======================================k-core MISC测试===========================", function () {
  it("total supply相关测试", async function () {
    const [deployer, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const kanamitCore = await ftryKCore.deploy();
    await kanamitCore.deployed();

    const ownerBalance = await kanamitCore.balanceOf(deployer.getAddress());
    const supply = await kanamitCore.totalSupply();

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('supply', supply.toNumber());

    expect(ownerBalance + 1).to.equal(supply); //supply比 tokenOwner多了一个 assetId 0
  });

  it("创建资产", async function () {

    const [deployer, user0, user1, user2] = await ethers.getSigners();

    const ftryKCore = await ethers.getContractFactory("KanamitCore");
    const kanamitCore = await ftryKCore.deploy();
    await kanamitCore.deployed();

    let supply = await kanamitCore.totalSupply();
    let ownerBalance = await kanamitCore.balanceOf(deployer.getAddress());
    let user0Balance = await kanamitCore.balanceOf(user0.getAddress());

    let iCount = supply.toNumber(); //assertId为0是默认初始化的，因此这里iCount为1

    console.log('deployer', await deployer.getAddress(), 'user0', await user0.getAddress(), 'user1', await user1.getAddress(), 'user2', await user2.getAddress());

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

    let uri = "https://twitter.com/zhoushx1018/status/1385995589117124614";
    let assetObject = await kanamitCore.createAsset(user0.getAddress(), uri);
    let eventCreate = await prmCreate;
    // console.log("eventCreate", eventCreate);
    console.log("AssetId", eventCreate["AssetId"].toNumber());
    console.log("assetHash", ethers.BigNumber.from(eventCreate["assetHash"]).toHexString());

    ownerBalance = await kanamitCore.balanceOf(deployer.getAddress());
    user0Balance = await kanamitCore.balanceOf(user0.getAddress());
    supply = await kanamitCore.totalSupply();

    //NFT总量验证
    expect(supply).to.equal(++iCount);

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('user0Balance', user0Balance.toNumber());
    console.log('supply', supply.toNumber());

    //根据AssetId验证NFT
    let currAssetHash = await kanamitCore.getAssetById(iCount - 1);
    expect(currAssetHash).to.equal(eventCreate["assetHash"]);

    console.log("currAssetHash", ethers.BigNumber.from(currAssetHash).toHexString());

    //根据ownerAddress、assetHash查找NFT
    await kanamitCore.getAsset(user0.getAddress(), currAssetHash).then(function (assetId) {
      console.log("assetId", assetId);
      expect(currAssetHash).to.equal(eventCreate["assetHash"]);
    });


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

    let uri1 = "https://twitter.com/zhoushx1018/status/1394366048300720130";
    let nftId1 = await kanamitCore.createAsset(user1.getAddress(), uri1);
    eventCreate = await prmCreate;
    // console.log("eventCreate", eventCreate);
    console.log("AssetId", eventCreate["AssetId"].toNumber());
    console.log("assetHash", ethers.BigNumber.from(eventCreate["assetHash"]).toHexString());

    ownerBalance = await kanamitCore.balanceOf(deployer.getAddress());
    let user1Balance = await kanamitCore.balanceOf(user1.getAddress());
    supply = await kanamitCore.totalSupply();

    //NFT总量验证
    expect(supply).to.equal(++iCount);

    console.log('ownerBalance', ownerBalance.toNumber());
    console.log('user1Balance', user1Balance.toNumber());
    console.log('supply', supply.toNumber());

    //根据AssetId验证NFT
    currAssetHash = await kanamitCore.getAssetById(iCount - 1);
    expect(currAssetHash).to.equal(eventCreate["assetHash"]);

    console.log("currAssetHash", ethers.BigNumber.from(currAssetHash).toHexString());

    //根据ownerAddress、assetHash查找NFT
    await kanamitCore.getAsset(user1.getAddress(), currAssetHash).then(function (assetId) {
      console.log("assetId", assetId);
      expect(iCount - 1).to.equal(assetId);
    });

    //根据uri查找 NFT
    let currAssetId = await kanamitCore.getAssetId(uri1);
    console.log("currAssetId", currAssetId);
    expect(iCount - 1).to.equal(currAssetId);

    //NFT 查找uri owner
    await kanamitCore.getUriOwner(uri1).then(function (addressOwner) {
      console.log("addressOwner", addressOwner);
    });

    // //NFT transfer，更换 owner
    await kanamitCore.connect(user1).transfer(user2.getAddress(), currAssetId);

    //NFT 查找uri owner
    await kanamitCore.getUriOwner(uri1).then(function (addressOwner) {
      console.log("addressOwner", addressOwner);
    });

  });
});