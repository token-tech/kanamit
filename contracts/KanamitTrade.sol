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

    uint256 private _nextAuctionId; //下一个可用的拍卖ID；
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
        _nextAuctionId = 1; //初始化为1； 0值无效； 后续map查询，当auctionId为0，视为无效auctionId
    }

    function _getNextAuctionId() public view returns (uint256) {
        return _nextAuctionId;
    }

    //@brief 获取当前最大可用的auctionID，并使_nextAuctionId+1
    function _IncreaseNextAuctionId() public returns (uint256) {
        return _nextAuctionId++;
    }

    function bid(
        uint256 reqId,
        string memory uri,
        address addressBidder
    )
        public
        payable
        returns (
            uint256 retReqId,
            uint256 retAuctionId,
            uint256 retBidId
        )
    {
        require(addressBidder != address(0), "bad bidder address");

        uint256 hashUri = uint256(keccak256(abi.encodePacked(uri)));
        uint256 amount = msg.value;
        (uint256 currAuctionId, uint256 status) = getAuctionStatus(uri);        
        bool bNewAuction = false;

        //新增拍卖
        //  uri之前没有拍卖过，或者当前的拍卖已经关闭，需要新增拍卖
        if (0 == currAuctionId || 1 == status) {            
            bNewAuction = true;
        }        

        //新增拍卖
        if (true == bNewAuction) {
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
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].bidder = addressBidder;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].amount = amount;
        mapAuctionInfo[currAuctionId].mapReqIdBid[reqId].cancel = false;

        balanceOf[addressBidder] += msg.value;
        emit EventBid(addressBidder, msg.value);

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

    //@param uri
    //@param auctionId; 0，当前的拍卖; 非0，指定auctionId的拍卖
    // function accept(string memory uri) public {}

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
