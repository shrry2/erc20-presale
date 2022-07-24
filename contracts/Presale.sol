// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

// For debug only
import "hardhat/console.sol";

contract Presale is Ownable {
    uint public feeAmount;

    event FeeAmountChanged(uint newFeeAmount);

    constructor(uint _feeAmount, address _ownerAddress) payable {
        // transfer ownership
        transferOwnership(_ownerAddress);

        // set initial fee amount
        setFeeAmount(_feeAmount);
    }

    function startPresale () public {
        // TODO
    }

    function buy() public {
        // TODO
    }

    function withdraw() public {
        // TODO
    }

    function endPresale() public {
        // TODO
    }

    // Admin

    function setFeeAmount(uint _feeAmount) public onlyOwner {
        // Check if new fee amount is in valid range
        require(_feeAmount <= 10000, "Invalid Fee Amount");

        feeAmount = _feeAmount;
        emit FeeAmountChanged(feeAmount);
    }
}
