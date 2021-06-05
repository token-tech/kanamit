// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

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

contract KanaShop is Ownable {
    address private kanaToken; //KanaToken address

    string public _name = "KanaToken shop";
    string public _symbol = "KanaShop";
    uint8 public _decimalsETH = 18;

    uint256 private _totalSellLimit = 200 * 10**uint256(_decimalsETH); //销售总量限制，200 ETH
    uint256 private _totalsold; //已售出总量；

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
    event EventBuyKana(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    event EventOwnerWithdraw(address indexed owner, uint256 amount);
    event EventCreate(address indexed owner, string uri, uint256 assetId);
    event EventBid(address indexed bidder, uint256 amount, uint256 reqId);
    event EventAccept(
        address indexed winner,
        uint256 amount,
        uint256 reqId,
        bool accept
    );

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(address _kToken) public {
        kanaToken = _kToken;
        _totalsold = 0;
    }

    fallback() external payable {
        buyKana();
    }

    receive() external payable {
        buyKana();
    }

    // function tmpTest() public view returns (uint256) {
    //     return IERC20(kanaToken).balanceOf(address(this));
    // }

    // function tmpTransfer(address to, uint256 amount)
    //     public
    //     onlyOwner
    //     returns (bool)
    // {
    //     return IERC20(kanaToken).transfer(to, amount);
    // }

    function buyKana() public payable {
        uint256 min = 1 * 10**uint256(_decimalsETH);
        uint256 max = 10 * 10**uint256(_decimalsETH);

        //单次购买限额
        require(msg.value >= min && msg.value <= max, "amount limit");

        //单地址购买总额限制
        require(
            balanceOf[msg.sender] + msg.value <= max,
            "address total limit error"
        );

        //销售总量限制
        require(_totalsold + msg.value <= _totalSellLimit, "total sell limit");

        balanceOf[msg.sender] += msg.value;
        _totalsold += msg.value;

        emit EventBuyKana(msg.sender, msg.value);
    }

    function ownerWithdraw(uint256 wad) public onlyOwner {
        payable(address(this.owner())).transfer(wad);
        emit EventOwnerWithdraw(address(this.owner()), wad);
    }

    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    function totalSellLimit() public view returns (uint256) {
        return _totalSellLimit;
    }

    function totalSold() public view returns (uint256) {
        return _totalsold;
    }

    function approve(address guy, uint256 wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function decimalsETH() public view returns (uint8) {
        return _decimalsETH;
    }
}
