// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AutoFlowEscrow
 * @notice Holds customer payments on-chain in escrow until service is confirmed.
 *         On release: 90% to the car-wash merchant, 10% to AutoFlow treasury.
 *         On refund (cancellation): 100% returned to customer.
 *         Auto-releases after AUTO_RELEASE_DELAY if customer never confirms.
 *
 * @dev    Supports ERC-20 stablecoins (USDT/USDC) on Avalanche C-Chain.
 *         Native AVAX not accepted — use ERC-20 only.
 *
 *         Security:
 *           - Reentrancy guard on all state-mutating external functions
 *           - Check-Effects-Interactions pattern throughout
 *           - SafeTransfer pattern: reverts on false return value from ERC-20
 *           - No delegatecall, no self-destruct
 *           - Only owner (AutoFlow relayer) can release/refund/admin
 *           - Emits events for every state change — fully auditable on SnowTrace
 *
 *         Deployment checklist:
 *           1. Deploy with treasury address (AutoFlow wallet)
 *           2. Set VITE_AUTOFLOW_ESCROW=<deployed address> in .env
 *           3. Verify on snowtrace.io using `hardhat verify`
 *
 * Avalanche C-Chain:
 *   USDT: 0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7
 *   USDC: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
 */

// ── Minimal ERC-20 interface (USDT/USDC) ──────────────────────────────────────
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract AutoFlowEscrow {

    // ── Constants ──────────────────────────────────────────────────────────────
    uint256 public constant PLATFORM_FEE_BPS  = 1000;          // 10%
    uint256 public constant AUTO_RELEASE_DELAY = 48 hours;      // auto-release after 48 h
    uint256 public constant MAX_FEE_BPS        = 2000;          // hard cap at 20%

    // ── Escrow lifecycle ───────────────────────────────────────────────────────
    enum Status { Empty, Deposited, Released, Refunded }

    struct EscrowEntry {
        address customer;       // who paid
        address merchant;       // car-wash wallet (receives 90%)
        address token;          // ERC-20 contract address
        uint256 amount;         // total deposited (in token decimals)
        uint64  depositedAt;    // unix timestamp
        Status  status;
    }

    // ── State ──────────────────────────────────────────────────────────────────
    address public owner;
    address public treasury;    // receives 10% platform fee
    uint256 public feeBps = PLATFORM_FEE_BPS;

    // bookingId (bytes32 of the UUID string) → escrow data
    mapping(bytes32 => EscrowEntry) private _escrows;

    // reentrancy lock
    bool private _locked;

    // ── Events ────────────────────────────────────────────────────────────────
    event EscrowDeposited(
        bytes32 indexed bookingId,
        address indexed customer,
        address indexed merchant,
        address         token,
        uint256         amount,
        uint256         timestamp
    );
    event EscrowReleased(
        bytes32 indexed bookingId,
        uint256         merchantAmount,
        uint256         platformFee,
        uint256         timestamp
    );
    event EscrowRefunded(
        bytes32 indexed bookingId,
        address         customer,
        uint256         amount,
        uint256         timestamp
    );
    event EscrowAutoReleased(bytes32 indexed bookingId, uint256 timestamp);
    event OwnershipTransferred(address indexed newOwner);
    event TreasuryUpdated(address indexed newTreasury);
    event FeeUpdated(uint256 newFeeBps);

    // ── Modifiers ──────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "AutoFlowEscrow: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "AutoFlowEscrow: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ── Constructor ────────────────────────────────────────────────────────────
    /**
     * @param _treasury  AutoFlow wallet that collects the 10% platform fee.
     *                   Set this to the same wallet as VITE_AUTOFLOW_WALLET.
     */
    constructor(address _treasury) {
        require(_treasury != address(0), "AutoFlowEscrow: zero treasury");
        owner    = msg.sender;
        treasury = _treasury;
    }

    // ── Customer: Deposit into escrow ──────────────────────────────────────────
    /**
     * @notice Deposit `amount` tokens into escrow for a booking.
     *         Caller must call token.approve(escrowAddress, amount) FIRST.
     *
     * @param bookingId  bytes32 representation of the AutoFlow booking UUID.
     *                   Compute off-chain: ethers.id(bookingUuid) or keccak256(abi.encode(bookingUuid))
     * @param merchant   Car-wash wallet address (receives 90% on release)
     * @param token      ERC-20 token contract (USDT or USDC on Avalanche)
     * @param amount     Amount in token smallest units (6 decimals for USDT/USDC)
     */
    function depositEscrow(
        bytes32 bookingId,
        address merchant,
        address token,
        uint256 amount
    ) external nonReentrant {
        // ── Checks ────────────────────────────────────────────────────────────
        require(_escrows[bookingId].status == Status.Empty, "AutoFlowEscrow: booking exists");
        require(merchant != address(0),                     "AutoFlowEscrow: zero merchant");
        require(token    != address(0),                     "AutoFlowEscrow: zero token");
        require(amount   > 0,                               "AutoFlowEscrow: zero amount");
        require(
            IERC20(token).allowance(msg.sender, address(this)) >= amount,
            "AutoFlowEscrow: insufficient allowance"
        );
        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "AutoFlowEscrow: insufficient balance"
        );

        // ── Effects ───────────────────────────────────────────────────────────
        _escrows[bookingId] = EscrowEntry({
            customer:    msg.sender,
            merchant:    merchant,
            token:       token,
            amount:      amount,
            depositedAt: uint64(block.timestamp),
            status:      Status.Deposited
        });

        // ── Interactions ──────────────────────────────────────────────────────
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "AutoFlowEscrow: transferFrom failed");

        emit EscrowDeposited(bookingId, msg.sender, merchant, token, amount, block.timestamp);
    }

    // ── Release (customer confirms service, or owner releases on their behalf) ─
    /**
     * @notice Release escrowed funds: 90% to merchant, 10% to treasury.
     *         May be called by:
     *           - The customer (happy path after service confirmation)
     *           - The owner (AutoFlow admin, e.g. after dispute resolution)
     *
     * @param bookingId  Same bytes32 used in depositEscrow
     */
    function releaseEscrow(bytes32 bookingId) external nonReentrant {
        EscrowEntry storage e = _escrows[bookingId];

        // ── Checks ────────────────────────────────────────────────────────────
        require(e.status == Status.Deposited, "AutoFlowEscrow: not in escrow");
        require(
            msg.sender == e.customer || msg.sender == owner,
            "AutoFlowEscrow: not authorized"
        );

        // ── Effects ───────────────────────────────────────────────────────────
        e.status = Status.Released;
        uint256 platformFee    = (e.amount * feeBps) / 10000;
        uint256 merchantAmount = e.amount - platformFee;

        // ── Interactions ──────────────────────────────────────────────────────
        _safeTransfer(e.token, e.merchant,  merchantAmount);
        _safeTransfer(e.token, treasury,    platformFee);

        emit EscrowReleased(bookingId, merchantAmount, platformFee, block.timestamp);
    }

    // ── Auto-release (callable by anyone after 48 h — trustless fallback) ──────
    /**
     * @notice After AUTO_RELEASE_DELAY has elapsed with no confirmation,
     *         anyone may call this to release funds to the merchant.
     *         Prevents funds being locked indefinitely if customer disappears.
     */
    function autoRelease(bytes32 bookingId) external nonReentrant {
        EscrowEntry storage e = _escrows[bookingId];
        require(e.status == Status.Deposited, "AutoFlowEscrow: not in escrow");
        require(
            block.timestamp >= uint256(e.depositedAt) + AUTO_RELEASE_DELAY,
            "AutoFlowEscrow: release delay not elapsed"
        );

        e.status = Status.Released;
        uint256 platformFee    = (e.amount * feeBps) / 10000;
        uint256 merchantAmount = e.amount - platformFee;

        _safeTransfer(e.token, e.merchant, merchantAmount);
        _safeTransfer(e.token, treasury,   platformFee);

        emit EscrowAutoReleased(bookingId, block.timestamp);
        emit EscrowReleased(bookingId, merchantAmount, platformFee, block.timestamp);
    }

    // ── Refund (owner only — used for cancellations / disputes) ──────────────
    /**
     * @notice Refund 100% of deposited funds back to the customer.
     *         Only callable by AutoFlow (owner). Never callable by customer
     *         directly — disputes go through AutoFlow support.
     */
    function refundEscrow(bytes32 bookingId) external onlyOwner nonReentrant {
        EscrowEntry storage e = _escrows[bookingId];
        require(e.status == Status.Deposited, "AutoFlowEscrow: not in escrow");

        e.status = Status.Refunded;

        _safeTransfer(e.token, e.customer, e.amount);

        emit EscrowRefunded(bookingId, e.customer, e.amount, block.timestamp);
    }

    // ── View helpers ──────────────────────────────────────────────────────────
    /**
     * @notice Returns full escrow details for a booking.
     */
    function getEscrow(bytes32 bookingId)
        external view
        returns (
            address customer,
            address merchant,
            address token,
            uint256 amount,
            uint64  depositedAt,
            Status  status
        )
    {
        EscrowEntry storage e = _escrows[bookingId];
        return (e.customer, e.merchant, e.token, e.amount, e.depositedAt, e.status);
    }

    /**
     * @notice Preview the split for a given amount at the current fee rate.
     */
    function previewSplit(uint256 amount)
        external view
        returns (uint256 merchantAmount, uint256 platformFee)
    {
        platformFee    = (amount * feeBps) / 10000;
        merchantAmount = amount - platformFee;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "AutoFlowEscrow: zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "AutoFlowEscrow: fee exceeds 20%");
        feeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AutoFlowEscrow: zero address");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────
    /**
     * @dev Wraps ERC-20 transfer — reverts if the token returns false.
     *      Some ERC-20s (non-standard) don't return a bool; this is safe
     *      for USDT and USDC on Avalanche which both return bool correctly.
     */
    function _safeTransfer(address token, address to, uint256 amount) internal {
        bool ok = IERC20(token).transfer(to, amount);
        require(ok, "AutoFlowEscrow: token transfer failed");
    }

    // ── Reject accidental AVAX ─────────────────────────────────────────────────
    receive()  external payable { revert("AutoFlowEscrow: AVAX not accepted"); }
    fallback() external payable { revert("AutoFlowEscrow: bad call"); }
}
