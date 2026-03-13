// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AutoFlowPayments
 * @notice Handles car care service payments on Avalanche C-Chain.
 *         Splits every payment 90% to the service business, 10% to AutoFlow.
 * @dev Supports ERC-20 tokens (USDT, USDC) and native AVAX.
 *      Deployed on Avalanche C-Chain (mainnet chainId: 43114).
 *      Verify on: https://snowtrace.io
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract AutoFlowPayments {
    // ── State ─────────────────────────────────────────────────────────────────
    address public owner;
    address public platformWallet;
    uint256 public platformFeeBps = 1000; // 10.00% (basis points, max 10000)

    // ── Events ────────────────────────────────────────────────────────────────
    /**
     * @notice Emitted on every successful payment.
     *         Use the bookingId + txHash to verify on SnowTrace.
     */
    event PaymentProcessed(
        string  indexed bookingId,
        address indexed businessWallet,
        address         token,          // address(0) = AVAX
        uint256         totalAmount,
        uint256         businessAmount, // 90%
        uint256         platformFee,    // 10%
        uint256         timestamp
    );

    event PlatformWalletUpdated(address indexed newWallet);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event OwnershipTransferred(address indexed newOwner);

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "AutoFlow: not authorized");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "AutoFlow: zero address");
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    // ── Payment: ERC-20 (USDT / USDC) ────────────────────────────────────────
    /**
     * @notice Pay for a booking using an ERC-20 stablecoin.
     *         Caller must approve this contract for `amount` tokens first.
     * @param bookingId  AutoFlow booking UUID (for on-chain traceability)
     * @param businessWallet  Owner's wallet — receives 90% of `amount`
     * @param tokenAddress    USDT or USDC contract address on Avalanche
     * @param amount          Token amount in smallest unit (6 decimals for USDT/USDC)
     */
    function payWithToken(
        string  calldata bookingId,
        address          businessWallet,
        address          tokenAddress,
        uint256          amount
    ) external {
        require(businessWallet != address(0), "AutoFlow: zero business wallet");
        require(tokenAddress   != address(0), "AutoFlow: zero token address");
        require(amount > 0,                   "AutoFlow: amount must be > 0");

        uint256 platformFee    = (amount * platformFeeBps) / 10000;
        uint256 businessAmount = amount - platformFee;

        IERC20 token = IERC20(tokenAddress);

        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "AutoFlow: insufficient token allowance"
        );
        require(
            token.balanceOf(msg.sender) >= amount,
            "AutoFlow: insufficient token balance"
        );

        // 90% → business
        require(
            token.transferFrom(msg.sender, businessWallet, businessAmount),
            "AutoFlow: business transfer failed"
        );
        // 10% → platform
        require(
            token.transferFrom(msg.sender, platformWallet, platformFee),
            "AutoFlow: platform transfer failed"
        );

        emit PaymentProcessed(
            bookingId,
            businessWallet,
            tokenAddress,
            amount,
            businessAmount,
            platformFee,
            block.timestamp
        );
    }

    // ── Payment: Native AVAX ──────────────────────────────────────────────────
    /**
     * @notice Pay for a booking using native AVAX.
     * @param bookingId      AutoFlow booking UUID
     * @param businessWallet Owner's wallet — receives 90% of msg.value
     */
    function payWithAVAX(
        string  calldata bookingId,
        address          businessWallet
    ) external payable {
        require(businessWallet != address(0), "AutoFlow: zero business wallet");
        require(msg.value > 0,               "AutoFlow: amount must be > 0");

        uint256 platformFee    = (msg.value * platformFeeBps) / 10000;
        uint256 businessAmount = msg.value - platformFee;

        (bool s1, ) = payable(businessWallet).call{ value: businessAmount }("");
        require(s1, "AutoFlow: business AVAX transfer failed");

        (bool s2, ) = payable(platformWallet).call{ value: platformFee }("");
        require(s2, "AutoFlow: platform AVAX transfer failed");

        emit PaymentProcessed(
            bookingId,
            businessWallet,
            address(0),
            msg.value,
            businessAmount,
            platformFee,
            block.timestamp
        );
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "AutoFlow: zero address");
        platformWallet = newWallet;
        emit PlatformWalletUpdated(newWallet);
    }

    /**
     * @param newFeeBps fee in basis points (1000 = 10%, max 2000 = 20%)
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 2000, "AutoFlow: fee exceeds 20%");
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AutoFlow: zero address");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    // ── View helpers ──────────────────────────────────────────────────────────
    /**
     * @notice Returns the business share and platform fee for a given amount.
     */
    function previewSplit(uint256 amount)
        external
        view
        returns (uint256 businessAmount, uint256 platformFee)
    {
        platformFee    = (amount * platformFeeBps) / 10000;
        businessAmount = amount - platformFee;
    }

    // Reject accidental AVAX sends
    receive() external payable { revert("AutoFlow: use payWithAVAX()"); }
}
