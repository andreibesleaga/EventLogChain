const { expect } = require('chai');
const { expectRevert, constants, BN } = require('@openzeppelin/test-helpers');

const LogChainToken = artifacts.require('LogChainToken');

contract('LogChainToken', function (accounts) {
    const [owner, user1, user2] = accounts;
    const INITIAL_SUPPLY = new BN('1000000000000'); // 1 trillion
    const DECIMALS = new BN('2');

    let token;

    beforeEach(async function () {
        token = await LogChainToken.new({ from: owner });
    });

    describe('Token metadata', function () {
        it('should have correct name', async function () {
            expect(await token.name()).to.equal('LogChainToken');
        });

        it('should have correct symbol', async function () {
            expect(await token.symbol()).to.equal('LOGC');
        });

        it('should have correct decimals', async function () {
            expect((await token.decimals()).toString()).to.equal(DECIMALS.toString());
        });
    });

    describe('Initial supply', function () {
        it('should mint initial supply to owner', async function () {
            const expectedSupply = INITIAL_SUPPLY.mul(new BN(10).pow(DECIMALS));
            expect((await token.balanceOf(owner)).toString()).to.equal(expectedSupply.toString());
        });

        it('should have correct total supply', async function () {
            const expectedSupply = INITIAL_SUPPLY.mul(new BN(10).pow(DECIMALS));
            expect((await token.totalSupply()).toString()).to.equal(expectedSupply.toString());
        });
    });

    describe('Transfers', function () {
        const transferAmount = new BN('1000');

        it('should allow owner to transfer tokens', async function () {
            await token.transfer(user1, transferAmount, { from: owner });
            expect((await token.balanceOf(user1)).toString()).to.equal(transferAmount.toString());
        });

        it('should update balances after transfer', async function () {
            const ownerBalanceBefore = await token.balanceOf(owner);
            await token.transfer(user1, transferAmount, { from: owner });

            expect((await token.balanceOf(owner)).toString()).to.equal(
                ownerBalanceBefore.sub(transferAmount).toString()
            );
        });

        it('should reject transfer exceeding balance', async function () {
            await expectRevert.unspecified(
                token.transfer(user1, transferAmount, { from: user2 })
            );
        });
    });

    describe('Minting (owner only)', function () {
        const mintAmount = new BN('5000');

        it('should allow owner to mint new tokens', async function () {
            await token.mint(user1, mintAmount, { from: owner });
            expect((await token.balanceOf(user1)).toString()).to.equal(mintAmount.toString());
        });

        it('should increase total supply when minting', async function () {
            const supplyBefore = await token.totalSupply();
            await token.mint(user1, mintAmount, { from: owner });

            expect((await token.totalSupply()).toString()).to.equal(
                supplyBefore.add(mintAmount).toString()
            );
        });

        it('should reject minting by non-owner', async function () {
            await expectRevert.unspecified(
                token.mint(user1, mintAmount, { from: user1 })
            );
        });

        it('should reject minting to zero address', async function () {
            await expectRevert(
                token.mint(constants.ZERO_ADDRESS, mintAmount, { from: owner }),
                'LogChainToken: mint to zero address'
            );
        });
    });

    describe('Burning', function () {
        const burnAmount = new BN('1000');

        beforeEach(async function () {
            await token.transfer(user1, burnAmount.mul(new BN('2')), { from: owner });
        });

        it('should allow users to burn their tokens', async function () {
            const balanceBefore = await token.balanceOf(user1);
            await token.burn(burnAmount, { from: user1 });

            expect((await token.balanceOf(user1)).toString()).to.equal(
                balanceBefore.sub(burnAmount).toString()
            );
        });

        it('should decrease total supply when burning', async function () {
            const supplyBefore = await token.totalSupply();
            await token.burn(burnAmount, { from: user1 });

            expect((await token.totalSupply()).toString()).to.equal(
                supplyBefore.sub(burnAmount).toString()
            );
        });

        it('should reject burning more than balance', async function () {
            const balance = await token.balanceOf(user1);
            await expectRevert.unspecified(
                token.burn(balance.add(new BN('1')), { from: user1 })
            );
        });
    });
});
