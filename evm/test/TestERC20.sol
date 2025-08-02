// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import {ERC20} from "@openzeppelin-contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("Test Token", "TT") {}
}
