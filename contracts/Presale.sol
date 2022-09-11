// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

// For debug only
import 'hardhat/console.sol';

contract Presale is Ownable, ERC165 {
    using Counters for Counters.Counter;

    /**
     * Constants
     */

    uint16 constant FEE_AMOUNT_PRECISION = 10000;

    /**
     * Variables
     */

    uint256 public feeAmount;

    Counters.Counter private _saleIds;

    struct Sale {
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 price;
        uint256 amount;
        address tokenAddress;
        address creatorAddress;
    }

    // mapping from saleId to Sale
    mapping(uint256 => Sale) public sales;

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

    function startPresale(
        uint256[] memory _startTimestamps,
        uint256[] memory _endTimestamps,
        uint256[] memory _prices,
        uint256[] memory _tokenAmounts,
        address[] memory _tokenAddresses
    ) public {
        // check if the arrays have the same length
        require(
            _startTimestamps.length > 0 &&
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
        require(_feeAmount <= FEE_AMOUNT_PRECISION, 'Invalid Fee Amount');
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

        // check if endTimestamp is after startTimestamp
        require(
            _endTimestamp > _startTimestamp,
            'endTimestamp must be after startTimestamp'
        );

        // issue new sale id
        _saleIds.increment();
        uint256 saleId = _saleIds.current();

        console.log('saleId', saleId);

        // transfer tokens to this contract
        IERC20 tokenContract = IERC20(_tokenAddress);
        tokenContract.transferFrom(
            _creatorAddress,
            address(this),
            _tokenAmount
        );

        // create new presale
        sales[saleId] = Sale(
            _startTimestamp,
            _endTimestamp,
            _price,
            _tokenAmount,
            _tokenAddress,
            _creatorAddress
        );

        // emit event
        emit SaleCreated(saleId);

        // return created sale id
        return saleId;
    }
}
