// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

interface IKanamitCore {
    function totalSupply() external view returns (uint256);

    function createAsset(address _owner, string memory _uri)
        external
        returns (uint256);

    function getAssetById(uint256 _id)
        external
        view
        returns (uint256 assetHash);
}

contract KanamitTrade is Ownable {
    address private kCore;

    string public name = "Kanamit Trade contract";
    string public symbol = "KanamitTrade";
    uint8 public decimals = 18;

    struct Bid {
        uint256 bidId;
        uint256 reqId; //对应于中心化系统的 bid表的id字段
        address bidder; //出价地址
        uint256 amount; //出价金额
        bool cancel; //是否取消
    }

    struct AuctionInfo {
        uint256 auctionId;
        uint256 hashUri;
        uint256 status; //状态；0，拍卖关闭；1，拍卖开启
        //Bid数据结构--数组+map
        uint256[] arrReqId; //出价信息数组；数据下标即为 bidId
        mapping(uint256 => Bid) mapReqIdBid; //map<reqId, Bid>
    }

    uint256 private _auctionId; //当前拍卖ID；
    mapping(uint256 => AuctionInfo) private mapAuctionInfo; //map<auctionId, auctionInfo>
    mapping(uint256 => uint256) private mapUriAuctionId; //map<hashUri, AuctionId>    

    event Approval(address indexed src, address indexed guy, uint256 wad);
    event Transfer(address indexed src, address indexed dst, uint256 wad);
    event Deposit(address indexed dst, uint256 wad);
    event EventBid(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(address _kCore) public {
        kCore = _kCore;
        _auctionId = 1; //初始化为1； 0值无效； 后续map查询，当auctionId为0，视为无效auctionId
    }

    function _getCurrAuctionId() public view returns (uint256) {
        return _auctionId;
    }

    //@brief 获取当前最大可用的auctionID，并使_auctionId+1
    function _nextAuctionId() public returns (uint256) {
        return _auctionId++;
    }

    function bid(
        uint256 reqId,
        string memory uri,
        address addressBidder,
        uint256 amount
    )
        public
        payable
        returns (
            uint256 retReqId,
            uint256 retAuctionId,
            uint256 retBidId
        )
    {
        uint256 hashUri = uint256(keccak256(abi.encodePacked(uri)));
        uint256 currAuctionId = mapUriAuctionId[hashUri];
        bool bNewAuction = false;

        //是否需要新增拍卖
        if (0 == currAuctionId) {
            //uri之前没有拍卖过，新增拍卖信息
            bNewAuction = true;
        } else {
            //判断当前拍卖信息，如果是已关闭，则需要新增拍卖信息
            uint256 status = mapAuctionInfo[currAuctionId].status;
            if (1 == status) bNewAuction = true;  //旧的拍卖已关闭；需要新增拍卖
        }

        //新增拍卖
        if (true == bNewAuction) {            
            currAuctionId = _nextAuctionId();
            mapUriAuctionId[hashUri] = currAuctionId;
        }

        //出价额度校验
        uint256 currBidLen = mapAuctionInfo[currAuctionId].arrReqId.length;
        if (currBidLen > 0) {
            uint256 currReqId =
                mapAuctionInfo[currAuctionId].arrReqId[currBidLen - 1];
            require(
                amount > mapAuctionInfo[hashUri].mapReqIdBid[currReqId].amount,
                "must large than last bid amount"
            );
        }

        //新增出价
        mapAuctionInfo[currAuctionId].auctionId = currAuctionId;
        mapAuctionInfo[currAuctionId].hashUri = hashUri;
        mapAuctionInfo[currAuctionId].arrReqId.push(reqId);
        uint256 bidId = mapAuctionInfo[currAuctionId].arrReqId.length -1;

        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].bidId = bidId;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].reqId = reqId;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].bidder = addressBidder;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].amount = amount;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].cancel = false;


        balanceOf[msg.sender] += msg.value;
        emit EventBid(msg.sender, msg.value);

        retReqId = reqId;
        retAuctionId = currAuctionId;
        retBidId = bidId;
    }

    function coreAddress() public view returns (address) {
        return kCore;
    }

    function setCoreAddress(address _kCore) public onlyOwner() {
        require(_kCore != address(0), "invalid address");
        kCore = _kCore;
    }

    function coreTotalSupply() public view returns (uint256) {
        return IKanamitCore(kCore).totalSupply();
    }

    function coreCreateAsset(address _owner, string memory _uri)
        public
        returns (uint256)
    {
        return IKanamitCore(kCore).createAsset(_owner, _uri);
    }

    function coreGetAssetById(uint256 _id)
        external
        view
        returns (uint256 assetHash)
    {
        return IKanamitCore(kCore).getAssetById(_id);
    }

    fallback() external payable {
        deposit();
    }

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 wad) public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;
        msg.sender.transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    function approve(address guy, uint256 wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(address dst, uint256 wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        require(balanceOf[src] >= wad);

        if (src != msg.sender && allowance[src][msg.sender] != uint256(-1)) {
            require(allowance[src][msg.sender] >= wad);
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}
