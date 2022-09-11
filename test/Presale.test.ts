import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

describe('Presale', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.

  // Fixture for deploying MockToken contract
  async function deployMockTokenContractFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const MockToken = await ethers.getContractFactory('MockToken');
    const mockToken = await MockToken.deploy();
    return { mockToken, owner, otherAccount };
  }

  // Fixture for deploying Presale contract
  async function deployPresaleContractFixture() {
    const FEE_AMOUNT = 500; // 5% in basis points
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const Presale = await ethers.getContractFactory('Presale');
    const presale = await Presale.deploy(FEE_AMOUNT, owner.address);
    return { presale, owner, otherAccount };
  }

  /**
   * constructor
   */

  describe('constructor', function () {
    it('should set the right owner', async function () {
      const { presale, owner } = await loadFixture(
        deployPresaleContractFixture
      );
      expect(await presale.owner()).to.equal(owner.address);
    });

    it('should set the initial fee amount', async function () {
      const { presale } = await loadFixture(deployPresaleContractFixture);
      expect(await presale.feeAmount()).to.equal(500);
    });
  });

  /**
   * setFeeAmount
   */

  describe('setFeeAmount', function () {
    describe('Validations', function () {
      it('should not allow non-owner to set fee amount', async function () {
        const { presale, otherAccount } = await loadFixture(
          deployPresaleContractFixture
        );

        await expect(
          presale.connect(otherAccount).setFeeAmount(500)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('should set allow owner to set fee amount', async function () {
        const { presale, owner } = await loadFixture(
          deployPresaleContractFixture
        );

        await expect(presale.connect(owner).setFeeAmount(800)).to.be.fulfilled;
        await expect(await presale.feeAmount()).to.be.equal(800);
      });

      it('should reject invalid fee amount', async function () {
        const { presale, owner } = await loadFixture(
          deployPresaleContractFixture
        );

        // happy path
        await expect(presale.connect(owner).setFeeAmount(0)).to.be.fulfilled;
        await expect(presale.connect(owner).setFeeAmount(10000)).to.be
          .fulfilled;

        // rejections
        await expect(presale.setFeeAmount(10001)).to.be.revertedWith(
          'Invalid Fee Amount'
        );
      });
    });

    describe('Events', function () {
      it('should emit an event on fee amount change', async function () {
        const { presale } = await loadFixture(deployPresaleContractFixture);

        await expect(presale.setFeeAmount(800))
          .to.emit(presale, 'FeeAmountChanged')
          .withArgs(800);
      });
    });
  });

  /**
   * startPresale
   */

  describe.only('startPresale', () => {
    describe('Validations', () => {
      it('should not accept invalid length parameters', async () => {
        const { presale } = await loadFixture(deployPresaleContractFixture);
        await expect(
          presale.startPresale([], [], [], [], [])
        ).to.be.revertedWith('Invalid Argument Length');
        await expect(
          presale.startPresale([1663648034], [], [], [], [])
        ).to.be.revertedWith('Invalid Argument Length');
      });
    });

    describe('Happy path', () => {
      it('should create single sale', async () => {
        const { mockToken } = await loadFixture(deployMockTokenContractFixture);
        // Contracts are deployed using the first signer/account by default
        const [owner] = await ethers.getSigners();
        const Presale = await ethers.getContractFactory('Presale');
        const presale = await Presale.deploy(500, owner.address);

        // 0.01 ETH ( Sell 1 MOK for 0.01 ETH)
        const priceOfMok = BigNumber.from('10000000000000000');
        const tokenAmount = BigNumber.from('100');

        // approve presale contract to transfer MOK tokens
        await mockToken.approve(presale.address, tokenAmount);

        await expect(
          presale.startPresale(
            [1661002034],
            [1663648034],
            [priceOfMok],
            [tokenAmount],
            [mockToken.address]
          )
        )
          .to.emit(presale, 'SaleCreated')
          .withArgs(1);

        // check if sale data is correct
        const sale = await presale.sales(1);
        expect(sale.startTimestamp).to.be.equal(1661002034);
        expect(sale.endTimestamp).to.be.equal(1663648034);
        expect(sale.price).to.be.equal(priceOfMok);
        expect(sale.amount).to.be.equal(100);
        expect(sale.tokenAddress).to.be.equal(mockToken.address);
        expect(sale.creatorAddress).to.be.equal(owner.address);
      });

      it('should create multiple sales', async () => {
        // deploy two MockToken contracts
        // because fixture does not currently support multiple loads
        const MockToken = await ethers.getContractFactory('MockToken');
        const mockToken1 = await MockToken.deploy();
        const mockToken2 = await MockToken.deploy();

        // Contracts are deployed using the first signer/account by default
        const [owner] = await ethers.getSigners();
        const Presale = await ethers.getContractFactory('Presale');
        const presale = await Presale.deploy(500, owner.address);

        const priceOfMok1 = BigNumber.from('10000000000000000');
        const priceOfMok2 = BigNumber.from('20000000000000000');

        const tokenAmountOfMok1 = BigNumber.from('100');
        const tokenAmountOfMok2 = BigNumber.from('200');

        // set allowance for presale contract
        await mockToken1.approve(presale.address, tokenAmountOfMok1);
        await mockToken2.approve(presale.address, tokenAmountOfMok2);

        await expect(
          presale.startPresale(
            [1661002034, 1661002034],
            [1663648034, 1663648034],
            [priceOfMok1, priceOfMok2],
            [tokenAmountOfMok1, tokenAmountOfMok2],
            [mockToken1.address, mockToken2.address]
          )
        ).not.to.be.reverted;

        const firstSale = await presale.sales(1);
        expect(firstSale.price).to.be.equal(priceOfMok1);

        const secondSale = await presale.sales(2);
        expect(secondSale.price).to.be.equal(priceOfMok2);

        // confirm that the presale contract has the correct balance of MOK tokens
        expect(await mockToken1.balanceOf(presale.address)).to.be.equal(
          tokenAmountOfMok1
        );
        expect(await mockToken2.balanceOf(presale.address)).to.be.equal(
          tokenAmountOfMok2
        );
      });
    });
  });
});
