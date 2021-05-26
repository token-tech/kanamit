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
    function transferOwnership(address newOwner) external;

    function transfer(address _to, uint256 _tokenId) external;

    function owner() external view returns (address);

    function getUriOwner(string memory uri)
        external
        view
        returns (address addressOwner);

    function totalSupply() external view returns (uint256);

    function createAsset(address _owner, string memory _uri)
        external
        returns (uint256);

    function getAssetId(string memory uri)
        external
        view
        returns (uint256 assetId);

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

    uint256 private _nextAuctionId; //下一个可用的拍卖ID；
    mapping(uint256 => AuctionInfo) private mapAuctionInfo; //map<auctionId, auctionInfo>
    mapping(uint256 => uint256) private mapUriAuctionId; //map<hashUri, AuctionId>
    mapping(uint256 => address) private mapUriOwner; //map<hashUri, addressOwner>

    event Approval(address indexed src, address indexed guy, uint256 wad);
    event Transfer(address indexed src, address indexed dst, uint256 wad);
    event Deposit(address indexed dst, uint256 wad);
    event EventBid(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);
    event EventAccept(address indexed winner, uint256 amount, bool success);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(address _kCore) public {
        kCore = _kCore;
        _nextAuctionId = 1; //初始化为1； 0值无效； 后续map查询，当auctionId为0，视为无效auctionId
    }

    function _getNextAuctionId() public view returns (uint256) {
        return _nextAuctionId;
    }

    //@brief 获取当前最大可用的auctionID，并使_nextAuctionId+1
    function _IncreaseNextAuctionId() public returns (uint256) {
        return _nextAuctionId++;
    }

    function bid(uint256 reqId, string memory uri)
        public
        payable
        returns (
            uint256 retReqId,
            uint256 retAuctionId,
            uint256 retBidId
        )
    {
        require(msg.sender != address(0), "bad bidder address");

        uint256 hashUri = uint256(keccak256(abi.encodePacked(uri)));
        require(msg.sender != mapUriOwner[hashUri], "uriOwner can not bid");

        uint256 assetId = IKanamitCore(kCore).getAssetId(uri);
        require(assetId != 0, "uri must be mint, first of all");

        uint256 amount = msg.value;
        (uint256 currAuctionId, uint256 status) = getAuctionStatus(uri);

        //新增拍卖
        //  uri之前没有拍卖过，或者当前的拍卖已经关闭，需要新增拍卖
        if (0 == currAuctionId || 1 == status) {
            currAuctionId = _IncreaseNextAuctionId();
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
        uint256 bidId = mapAuctionInfo[currAuctionId].arrReqId.length - 1;

        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].bidId = bidId;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].reqId = reqId;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].bidder = msg.sender;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].amount = amount;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].cancel = false;

        balanceOf[address(this)] += msg.value;
        emit EventBid(address(this), msg.value);

        retReqId = reqId;
        retAuctionId = currAuctionId;
        retBidId = bidId;
    }

    //@param uri
    //@param auctionId; 0，当前的拍卖; 非0，指定auctionId的拍卖
    function getBids(string memory uri, uint256 inputAuction)
        public
        view
        returns (
            uint256 auctionId,
            uint256 totalBids,
            uint256[] memory bidIds,
            uint256[] memory reqIds,
            address[] memory addressBidders,
            uint256[] memory amounts,
            bool[] memory cancels
        )
    {
        uint256 hashUri = uint256(keccak256(abi.encodePacked(uri)));
        uint256 currAuctinId = inputAuction;

        //当前拍卖ID
        if (inputAuction == 0) {
            currAuctinId = mapUriAuctionId[hashUri];
        }

        auctionId = currAuctinId;
        totalBids = 0;

        if (currAuctinId > 0) {
            totalBids = mapAuctionInfo[currAuctinId].arrReqId.length;
        }

        uint256[] memory retBidIds = new uint256[](totalBids);
        uint256[] memory retReqIds = new uint256[](totalBids);
        address[] memory retAddressBidders = new address[](totalBids);
        uint256[] memory retAmounts = new uint256[](totalBids);
        bool[] memory retCancel = new bool[](totalBids);

        for (uint256 i = 0; i < totalBids; i++) {
            uint256 currReqId = mapAuctionInfo[currAuctinId].arrReqId[i];

            retBidIds[i] = mapAuctionInfo[currAuctinId].mapReqIdBid[currReqId]
                .bidId;
            retReqIds[i] = mapAuctionInfo[currAuctinId].mapReqIdBid[currReqId]
                .reqId;
            retAddressBidders[i] = mapAuctionInfo[currAuctinId].mapReqIdBid[
                currReqId
            ]
                .bidder;
            retAmounts[i] = mapAuctionInfo[currAuctinId].mapReqIdBid[currReqId]
                .amount;
            retCancel[i] = mapAuctionInfo[currAuctinId].mapReqIdBid[currReqId]
                .cancel;
        }

        bidIds = retBidIds;
        reqIds = retReqIds;
        addressBidders = retAddressBidders;
        amounts = retAmounts;
        cancels = retCancel;
    }

    //@return auctionId，拍卖ID；0， 表示拍卖不存在；非0，有效的拍卖ID
    //@return status，拍卖状态；0，拍卖中； 1， 拍卖已关闭；
    function getAuctionStatus(string memory uri)
        public
        view
        returns (uint256 auctionId, uint256 status)
    {
        uint256 hashUri = uint256(keccak256(abi.encodePacked(uri)));
        auctionId = mapUriAuctionId[hashUri];

        status = 0;
        if (auctionId > 0) status = mapAuctionInfo[auctionId].status;
    }

    function coreGetUriOwner(string memory uri)
        external
        view
        returns (address addressOwner)
    {
        return IKanamitCore(kCore).getUriOwner(uri);
    }

    function accept(string memory uri, uint256 amount)
        public
        returns (bool success)
    {
        success = false;
        (uint256 currAuctionId, uint256 status) = getAuctionStatus(uri);
        uint256 hashUri = uint256(keccak256(abi.encodePacked(uri)));

        require(msg.sender == mapUriOwner[hashUri], "only uriOwner can accept");

        require(
            currAuctionId != 0,
            "no auction for uri. first of all, uri need a bid."
        );
        require(status != 1, "auction is close");

        (
            uint256 auctionId,
            uint256 totalBids,
            uint256[] memory bidIds,
            uint256[] memory reqIds,
            address[] memory addressBidders,
            uint256[] memory amounts,
            bool[] memory cancels
        ) = getBids(uri, currAuctionId);
        require(bidIds.length == totalBids, "array element error");
        require(reqIds.length == totalBids, "array element error");
        require(addressBidders.length == totalBids, "array element error");
        require(amounts.length == totalBids, "array element error");
        require(cancels.length == totalBids, "array element error");

        //查找winner
        uint256 iIndexWinner = 0;
        for (uint256 i = 0; i < totalBids; i++) {
            if (true == cancels[i]) continue; //忽略已撤销的

            if (amount == amounts[i]) {
                success = true;
                iIndexWinner = i;
            }
        }

        //没有winner 直接报错
        require(true == success, "no match bid");

        //loser返还主币
        for (uint256 i = 0; i < totalBids; i++) {
            if (true == cancels[i]) continue; //忽略已撤销的

            if (i == iIndexWinner) continue; //忽略winner

            //losser返还主币
            _returnMainCoin(payable(addressBidders[i]), amounts[i]);
        }

        _transerUriOwner(uri, addressBidders[iIndexWinner]);

        //旧owner获得主币
        // require(balanceOf[address(this)] >= amount);
        // balanceOf[address(this)] -= amount;
        // msg.sender.transfer(amount);

        // emit Withdrawal(msg.sender, amount); //withdraw事件
        _returnMainCoin(msg.sender, amount);

        //Uri owner，从本合约转到winner
        mapUriOwner[hashUri] = addressBidders[iIndexWinner];

        //拍卖状态，调整为已关闭
        mapAuctionInfo[auctionId].status = 1;

        //accept事件
        emit EventAccept(addressBidders[iIndexWinner], amount, success);

        return success;
    }

    function _returnMainCoin(address payable addrReturn, uint256 amount)
        internal
    {
        require(balanceOf[address(this)] >= amount);
        balanceOf[address(this)] -= amount;

        addrReturn.transfer(amount);

        emit Withdrawal(addrReturn, amount);
    }

    function _transerUriOwner(string memory uri, address addressBidder)
        internal
    {
        uint256 assetId = this.coreGetAssetId(uri);
        require(assetId != 0, "assetId error");

        IKanamitCore(kCore).transfer(addressBidder, assetId);
    }

    function coreAddress() public view returns (address) {
        return kCore;
    }

    function setCoreAddress(address _kCore) public onlyOwner() {
        require(_kCore != address(0), "invalid address");
        kCore = _kCore;
    }

    function coreTransferOwnership(address newOwner) public onlyOwner() {
        IKanamitCore(kCore).transferOwnership(newOwner);
    }

    function coreTotalSupply() public view returns (uint256) {
        return IKanamitCore(kCore).totalSupply();
    }

    function coreCreateAsset(address _owner, string memory _uri)
        public
        onlyOwner()
        returns (uint256)
    {
        uint256 hashUri = uint256(keccak256(abi.encodePacked(_uri)));
        require(mapUriOwner[hashUri] == address(0), "uri already mint");

        mapUriOwner[hashUri] = _owner;
        return IKanamitCore(kCore).createAsset(address(this), _uri);
    }

    function coreGetAssetId(string memory uri) external view returns (uint256) {
        return IKanamitCore(kCore).getAssetId(uri);
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
