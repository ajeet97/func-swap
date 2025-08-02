// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import "forge-std/src/Test.sol";
import "forge-std/src/console2.sol";

import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {Address} from "solidity-utils/contracts/libraries/AddressLib.sol";

import {Timelocks, TimelocksLib} from "../src/libraries/TimelocksLib.sol";
import {IBaseEscrow} from "../src/interfaces/IBaseEscrow.sol";
import {IEscrowSrc} from "../src/interfaces/IEscrowSrc.sol";
import {EscrowFactory} from "../src/EscrowFactory.sol";

import {TestERC20} from "./TestERC20.sol";

contract TestEscrowFactory is Test {
    using TimelocksLib for Timelocks;

    IERC20 public ACCESS_TOKEN = IERC20(makeAddr("access_token"));
    IERC20 public TEST_TOKEN = new TestERC20();

    address public maker = makeAddr("maker");
    address public taker = makeAddr("taker");

    EscrowFactory public factory;

    event SrcEscrowCreated(address escrow, bytes32 hashlock, Address maker);

    function setUp() public {
        factory = new EscrowFactory(ACCESS_TOKEN, 600, 600);
    }

    function test_SrcEscrow() public {
        vm.deal(maker, 0.001 ether);
        deal(address(TEST_TOKEN), maker, 1 ether);

        bytes32 secret = bytes32("$3cr3t");
        IBaseEscrow.Immutables memory immutables = _getImmutables(secret);

        address escrow = factory.addressOfEscrowSrc(immutables);
        console2.log("escrow:", escrow);

        ///////////////////
        // create escrow //
        ///////////////////

        vm.startPrank(maker);

        TEST_TOKEN.approve(address(factory), 1 ether);

        vm.expectEmit(true, true, true, true);
        emit SrcEscrowCreated(escrow, immutables.hashlock, immutables.maker);
        factory.createSrcEscrow{value: 0.001 ether}(immutables);

        vm.stopPrank();

        //////////////
        // withdraw //
        //////////////

        vm.expectRevert("InvalidCaller()");
        IEscrowSrc(escrow).withdraw(secret, immutables);

        vm.startPrank(taker);

        vm.expectRevert("InvalidTime()");
        IEscrowSrc(escrow).withdraw(secret, immutables);

        vm.warp(
            vm.getBlockTimestamp() +
                immutables.timelocks.get(TimelocksLib.Stage.SrcWithdrawal)
        );

        uint256 tokenBalBefore = TEST_TOKEN.balanceOf(taker);
        uint256 ethBalBefore = taker.balance;

        IEscrowSrc(escrow).withdraw(secret, immutables);

        uint256 tokenBalAfter = TEST_TOKEN.balanceOf(taker);

        vm.assertEq(tokenBalAfter - tokenBalBefore, 1 ether);
        vm.assertEq(taker.balance - ethBalBefore, 0.001 ether);

        vm.stopPrank();
    }

    function _getImmutables(
        bytes32 secret
    ) internal view returns (IBaseEscrow.Immutables memory) {
        return
            IBaseEscrow.Immutables({
                orderHash: keccak256("order_1"),
                hashlock: keccak256(abi.encodePacked(secret)),
                maker: Address.wrap(uint160(maker)),
                taker: Address.wrap(uint160(taker)),
                token: Address.wrap(uint160(address(TEST_TOKEN))),
                amount: 1 ether,
                safetyDeposit: 0.001 ether,
                timelocks: _getTimelocks(60, 120, 60, 120)
            });
    }

    function _getTimelocks(
        uint256 srcWithdrawal,
        uint256 srcCancellation,
        uint256 dstWithdrawal,
        uint256 dstCancellation
    ) internal view returns (Timelocks) {
        return
            Timelocks.wrap(
                srcWithdrawal |
                    ((2 * srcWithdrawal) << 32) |
                    (srcCancellation << 64) |
                    ((2 * srcCancellation) << 96) |
                    (dstWithdrawal << 128) |
                    ((2 * dstWithdrawal) << 160) |
                    (dstCancellation << 192) |
                    (block.timestamp << 224)
            );
    }
}
