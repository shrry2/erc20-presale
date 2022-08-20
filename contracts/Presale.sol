// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

// For debug only
import 'hardhat/console.sol';

contract Presale is Ownable, ERC165 {
    /**
     * Variables
     */

    uint256 public feeAmount;

    struct TokenSale {
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 price;
        uint256 amount;
        address tokenAddress;
        address creatorAddress;
    }

    // Array with all token sales
    TokenSale[] public allTokenSales;

    /**
     * Events
     */

    event FeeAmountChanged(uint256 newFeeAmount);
    event SaleCreated(uint256 newSaleId);

    /**
     * Constructor
     */
    constructor(uint256 _feeAmount, address _ownerAddress) {
        // transfer ownership
        transferOwnership(_ownerAddress);

        // set initial fee amount
        setFeeAmount(_feeAmount);
    }

    /**
     * Public functions
     */

    function totalTokenSales() public view returns (uint256) {
        return allTokenSales.length;
    }

    function startPresale(
        uint256[] memory _startTimestamps,
        uint256[] memory _endTimestamps,
        uint256[] memory _prices,
        uint256[] memory _tokenAmounts,
        address[] memory _tokenAddresses
    ) public {
        // check if the arrays have the same length
        require(
            _startTimestamps.length == _endTimestamps.length &&
                _startTimestamps.length == _prices.length &&
                _startTimestamps.length == _tokenAmounts.length &&
                _startTimestamps.length == _tokenAddresses.length,
            'Invalid Argument Length'
        );

        // create each token sales
        for (uint256 i = 0; i < _startTimestamps.length; i++) {
            _createTokenSale(
                _startTimestamps[i],
                _endTimestamps[i],
                _prices[i],
                _tokenAmounts[i],
                _tokenAddresses[i],
                msg.sender
            );
        }
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

    function setFeeAmount(uint256 _feeAmount) public onlyOwner {
        // Check if new fee amount is in valid range
        require(_feeAmount <= 10000, 'Invalid Fee Amount');
        feeAmount = _feeAmount;
        emit FeeAmountChanged(feeAmount);
    }

    /**
     * Internal functions
     */

    function _createTokenSale(
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        uint256 _price,
        uint256 _tokenAmount,
        address _tokenAddress,
        address _creatorAddress
    ) internal returns (uint256) {
        require(_tokenAddress != address(0), 'Token address is zero address');

        // check if the token contract have enough tokens to sell
        require(
            IERC20(_tokenAddress).balanceOf(_creatorAddress) >= _tokenAmount,
            'Token address does not have enough tokens to sell'
        );

        // create new presale
        uint256 newSaleId = totalTokenSales();

        allTokenSales[newSaleId] = TokenSale(
            _startTimestamp,
            _endTimestamp,
            _price,
            _tokenAmount,
            _tokenAddress,
            _creatorAddress
        );

        // emit event
        emit SaleCreated(newSaleId);

        // return created sale id
        return newSaleId;
    }
}
