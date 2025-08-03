// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import {Clones} from "@openzeppelin-contracts/proxy/Clones.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {Create2} from "@openzeppelin-contracts/utils/Create2.sol";
import {Address, AddressLib} from "solidity-utils/contracts/libraries/AddressLib.sol";
import {SafeERC20} from "solidity-utils/contracts/libraries/SafeERC20.sol";

import {ImmutablesLib} from "./libraries/ImmutablesLib.sol";
import {Timelocks, TimelocksLib} from "./libraries/TimelocksLib.sol";
import {ProxyHashLib} from "./libraries/ProxyHashLib.sol";

import {IEscrowFactory} from "./interfaces/IEscrowFactory.sol";
import {IBaseEscrow} from "./interfaces/IBaseEscrow.sol";

import {EscrowSrc} from "./EscrowSrc.sol";
import {EscrowDst} from "./EscrowDst.sol";

/**
 * @title Contract for escrow factory
 * @notice Contract to create escrow contracts for cross-chain atomic swap.
 * @dev Immutable variables must be set in the constructor of the derived contracts.
 * @custom:security-contact security@1inch.io
 */
contract EscrowFactory is IEscrowFactory {
    using AddressLib for Address;
    using Clones for address;
    using ImmutablesLib for IBaseEscrow.Immutables;
    using SafeERC20 for IERC20;
    using TimelocksLib for Timelocks;

    /// @notice See {IEscrowFactory-ESCROW_SRC_IMPLEMENTATION}.
    address public immutable ESCROW_SRC_IMPLEMENTATION;
    /// @notice See {IEscrowFactory-ESCROW_DST_IMPLEMENTATION}.
    address public immutable ESCROW_DST_IMPLEMENTATION;
    bytes32 internal immutable _PROXY_SRC_BYTECODE_HASH;
    bytes32 internal immutable _PROXY_DST_BYTECODE_HASH;

    constructor(
        IERC20 accessToken,
        uint32 rescueDelaySrc,
        uint32 rescueDelayDst
    ) {
        ESCROW_SRC_IMPLEMENTATION = address(
            new EscrowSrc(rescueDelaySrc, accessToken)
        );
        ESCROW_DST_IMPLEMENTATION = address(
            new EscrowDst(rescueDelayDst, accessToken)
        );
        _PROXY_SRC_BYTECODE_HASH = ProxyHashLib.computeProxyBytecodeHash(
            ESCROW_SRC_IMPLEMENTATION
        );
        _PROXY_DST_BYTECODE_HASH = ProxyHashLib.computeProxyBytecodeHash(
            ESCROW_DST_IMPLEMENTATION
        );
    }

    /**
     * @notice See {IEscrowFactory-createSrcEscrow}.
     */
    function createSrcEscrow(
        IBaseEscrow.Immutables calldata immutables
    ) external payable {
        address token = immutables.token.get();
        uint256 nativeAmount = immutables.safetyDeposit;
        if (token == address(0)) {
            nativeAmount += immutables.amount;
        }
        if (msg.value != nativeAmount) revert InsufficientEscrowBalance();

        // TODO: validate timelocks?
        // (srcWithdrawal < srcPublicWithdrawal < srcCancellation)

        // IBaseEscrow.Immutables memory immutables = srcImmutables;
        // immutables.timelocks = immutables.timelocks.setDeployedAt(
        //     block.timestamp
        // );

        bytes32 salt = immutables.hashMem();
        address escrow = _deployEscrow(
            salt,
            msg.value,
            ESCROW_SRC_IMPLEMENTATION
        );
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(
                msg.sender,
                escrow,
                immutables.amount
            );
        }

        emit SrcEscrowCreated(escrow, immutables.hashlock, immutables.maker);
    }

    /**
     * @notice See {IEscrowFactory-createDstEscrow}.
     */
    function createDstEscrow(
        IBaseEscrow.Immutables calldata immutables
    ) external payable {
        address token = immutables.token.get();
        uint256 nativeAmount = immutables.safetyDeposit;
        if (token == address(0)) {
            nativeAmount += immutables.amount;
        }
        if (msg.value != nativeAmount) revert InsufficientEscrowBalance();

        // IBaseEscrow.Immutables memory immutables = dstImmutables;
        // immutables.timelocks = immutables.timelocks.setDeployedAt(
        //     block.timestamp
        // );

        bytes32 salt = immutables.hashMem();
        address escrow = _deployEscrow(
            salt,
            msg.value,
            ESCROW_DST_IMPLEMENTATION
        );
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(
                msg.sender,
                escrow,
                immutables.amount
            );
        }

        emit DstEscrowCreated(escrow, immutables.hashlock, immutables.taker);
    }

    /**
     * @notice See {IEscrowFactory-addressOfEscrowSrc}.
     */
    function addressOfEscrowSrc(
        IBaseEscrow.Immutables calldata immutables
    ) external view virtual returns (address) {
        return
            Create2.computeAddress(immutables.hash(), _PROXY_SRC_BYTECODE_HASH);
    }

    /**
     * @notice See {IEscrowFactory-addressOfEscrowDst}.
     */
    function addressOfEscrowDst(
        IBaseEscrow.Immutables calldata immutables
    ) external view virtual returns (address) {
        return
            Create2.computeAddress(immutables.hash(), _PROXY_DST_BYTECODE_HASH);
    }

    /**
     * @notice Deploys a new escrow contract.
     * @param salt The salt for the deterministic address computation.
     * @param value The value to be sent to the escrow contract.
     * @param implementation Address of the implementation.
     * @return escrow The address of the deployed escrow contract.
     */
    function _deployEscrow(
        bytes32 salt,
        uint256 value,
        address implementation
    ) internal virtual returns (address escrow) {
        escrow = implementation.cloneDeterministic(salt, value);
    }
}
