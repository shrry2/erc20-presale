import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Presale", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployPresaleContractFixture() {
    const FEE_AMOUNT = 500; // 5% in basis points

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Presale = await ethers.getContractFactory("Presale");
    const presale = await Presale.deploy(FEE_AMOUNT, owner.address);

    return {presale, owner, otherAccount};
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {presale, owner} = await loadFixture(deployPresaleContractFixture);

      expect(await presale.owner()).to.equal(owner.address);
    });

    it("Should set the initial fee amount", async function () {
      const {presale} = await loadFixture(deployPresaleContractFixture);

      expect(await presale.feeAmount()).to.equal(500);
    });
  });

  describe("SetFeeAmount", function () {
    describe("Validations", function () {
      it("Should not allow non-owner to set fee amount", async function () {
        const {presale, otherAccount} = await loadFixture(deployPresaleContractFixture);

        await expect(presale.connect(otherAccount).setFeeAmount(500)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      it("Should set allow owner to set fee amount", async function () {
        const {presale, owner} = await loadFixture(
          deployPresaleContractFixture
        );

        await expect(presale.connect(owner).setFeeAmount(800)).to.be.fulfilled;
        await expect(await presale.feeAmount()).to.be.equal(800);
      });

      it("Should reject invalid fee amount", async function () {
        const {presale, owner} = await loadFixture(
          deployPresaleContractFixture
        );

        // happy path
        await expect(presale.connect(owner).setFeeAmount(0)).to.be.fulfilled;
        await expect(presale.connect(owner).setFeeAmount(10000)).to.be.fulfilled;

        // rejections
        await expect(presale.setFeeAmount(10001)).to.be.revertedWith('Invalid Fee Amount');
      });
    });

    describe("Events", function () {
      it("Should emit an event on fee amount change", async function () {
        const {presale} = await loadFixture(
          deployPresaleContractFixture
        );

        await expect(presale.setFeeAmount(800))
          .to.emit(presale, "FeeAmountChanged")
          .withArgs(800);
      });
    });
  });
});
