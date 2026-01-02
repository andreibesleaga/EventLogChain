const { expect } = require('chai');
const { BN } = require('@openzeppelin/test-helpers');

const EventLog = artifacts.require('EventLog');
const LogChainToken = artifacts.require('LogChainToken');

/**
 * Integration Tests
 * 
 * Tests the interaction between EventLog and LogChainToken contracts
 * and validates end-to-end workflows
 */
contract('Integration: EventLog + LogChainToken', function (accounts) {
    const [owner, user1, user2] = accounts;
    let eventLog;
    let token;

    beforeEach(async function () {
        eventLog = await EventLog.new({ from: owner });
        token = await LogChainToken.new({ from: owner });
    });

    describe('Dual Contract Deployment', function () {
        it('should deploy both contracts with correct ownership', async function () {
            expect(await eventLog.owner()).to.equal(owner);
            expect(await token.owner()).to.equal(owner);
        });

        it('should have correct initial states', async function () {
            expect(await eventLog.paused()).to.be.false;

            const totalSupply = await token.totalSupply();
            const ownerBalance = await token.balanceOf(owner);
            expect(totalSupply.toString()).to.equal(ownerBalance.toString());
        });
    });

    describe('Token-Gated Logging Workflow', function () {
        it('should allow token holders to log events', async function () {
            // Transfer tokens to user
            const tokenAmount = new BN('1000');
            await token.transfer(user1, tokenAmount, { from: owner });

            // Verify user has tokens
            const balance = await token.balanceOf(user1);
            expect(balance.toString()).to.equal(tokenAmount.toString());

            // User can log events
            const timestamp = Math.floor(Date.now() / 1000);
            const logType = web3.utils.asciiToHex('TOKEN').padEnd(18, '0');
            const logMsg = web3.utils.asciiToHex('Token holder log').padEnd(66, '0');

            const receipt = await eventLog.log(timestamp, logType, logMsg, { from: user1 });
            expect(receipt.logs.length).to.be.above(0);
        });

        it('should handle multiple users with different token amounts logging concurrently', async function () {
            // Distribute tokens
            await token.transfer(user1, new BN('5000'), { from: owner });
            await token.transfer(user2, new BN('3000'), { from: owner });

            // Both users log events
            const timestamp = Math.floor(Date.now() / 1000);
            const logType1 = web3.utils.asciiToHex('USER1').padEnd(18, '0');
            const logType2 = web3.utils.asciiToHex('USER2').padEnd(18, '0');
            const logMsg = web3.utils.asciiToHex('Concurrent test').padEnd(66, '0');

            const [receipt1, receipt2] = await Promise.all([
                eventLog.log(timestamp, logType1, logMsg, { from: user1 }),
                eventLog.log(timestamp + 1, logType2, logMsg, { from: user2 })
            ]);

            expect(receipt1.logs[0].args.sender).to.equal(user1);
            expect(receipt2.logs[0].args.sender).to.equal(user2);
        });
    });

    describe('Emergency Scenarios', function () {
        it('should pause logging while token transfers continue', async function () {
            // Pause logging
            await eventLog.pause({ from: owner });
            expect(await eventLog.paused()).to.be.true;

            // Token transfers should still work
            const transferAmount = new BN('1000');
            await token.transfer(user1, transferAmount, { from: owner });
            expect((await token.balanceOf(user1)).toString()).to.equal(transferAmount.toString());

            // Logging should fail
            const timestamp = Math.floor(Date.now() / 1000);
            const logType = web3.utils.asciiToHex('TEST').padEnd(18, '0');
            const logMsg = web3.utils.asciiToHex('Should fail').padEnd(66, '0');

            try {
                await eventLog.log(timestamp, logType, logMsg, { from: user1 });
                expect.fail('Should have reverted');
            } catch (error) {
                expect(error.message).to.include('revert');
            }
        });

        it('should handle ownership transfer across both contracts', async function () {
            // Transfer ownership of both contracts
            await eventLog.transferOwnership(user1, { from: owner });
            await token.transferOwnership(user1, { from: owner });

            expect(await eventLog.owner()).to.equal(user1);
            expect(await token.owner()).to.equal(user1);

            // Only new owner can pause/mint
            await eventLog.pause({ from: user1 });
            await token.mint(user2, new BN('5000'), { from: user1 });

            expect(await eventLog.paused()).to.be.true;
            expect((await token.balanceOf(user2)).toString()).to.equal('5000');
        });
    });

    describe('High-Volume Logging', function () {
        it('should handle multiple sequential logs efficiently', async function () {
            const logCount = 10;
            const gasUsed = [];

            for (let i = 0; i < logCount; i++) {
                const timestamp = Math.floor(Date.now() / 1000) + i;
                const logType = web3.utils.asciiToHex(`LOG${i}`).padEnd(18, '0');
                const logMsg = web3.utils.asciiToHex(`Message ${i}`).padEnd(66, '0');

                const receipt = await eventLog.log(timestamp, logType, logMsg, { from: user1 });
                gasUsed.push(receipt.receipt.gasUsed);
            }

            // Gas should be relatively consistent (± 10%)
            const avgGas = gasUsed.reduce((a, b) => a + b, 0) / gasUsed.length;
            gasUsed.forEach(gas => {
                expect(gas).to.be.closeTo(avgGas, avgGas * 0.1);
            });

            console.log(`      Average gas for ${logCount} logs: ${Math.round(avgGas)}`);
        });

        it('should retrieve all logs after high-volume insertion', async function () {
            // Create multiple logs
            const logCount = 5;
            const timestamps = [];

            for (let i = 0; i < logCount; i++) {
                const timestamp = Math.floor(Date.now() / 1000) + i;
                timestamps.push(timestamp);
                const logType = web3.utils.asciiToHex('BATCH').padEnd(18, '0');
                const logMsg = web3.utils.asciiToHex(`Batch ${i}`).padEnd(66, '0');

                await eventLog.log(timestamp, logType, logMsg, { from: user1 });
            }

            // Retrieve events
            const events = await eventLog.getPastEvents('LogEntry', {
                fromBlock: 0,
                toBlock: 'latest'
            });

            expect(events.length).to.be.at.least(logCount);

            // Verify timestamps
            const foundTimestamps = events.map(e => parseInt(e.returnValues.userTimestamp));
            timestamps.forEach(ts => {
                expect(foundTimestamps).to.include(ts);
            });
        });
    });

    describe('Real-World Scenario: Application Lifecycle', function () {
        it('should handle complete application lifecycle', async function () {
            console.log('      Simulating application lifecycle...');

            // 1. Initial setup: Distribute tokens to users
            console.log('      1. Distributing tokens to users');
            await token.transfer(user1, new BN('10000'), { from: owner });
            await token.transfer(user2, new BN('10000'), { from: owner });

            // 2. Application start: Log startup event
            console.log('      2. Logging application startup');
            const startTime = Math.floor(Date.now() / 1000);
            await eventLog.log(
                startTime,
                web3.utils.asciiToHex('STARTUP').padEnd(18, '0'),
                web3.utils.asciiToHex('App v1.0 started').padEnd(66, '0'),
                { from: owner }
            );

            // 3. User activity: Multiple users log actions
            console.log('      3. Users performing actions');
            await eventLog.log(
                startTime + 10,
                web3.utils.asciiToHex('LOGIN').padEnd(18, '0'),
                web3.utils.asciiToHex('User1 login').padEnd(66, '0'),
                { from: user1 }
            );

            await eventLog.log(
                startTime + 15,
                web3.utils.asciiToHex('LOGIN').padEnd(18, '0'),
                web3.utils.asciiToHex('User2 login').padEnd(66, '0'),
                { from: user2 }
            );

            // 4. Token transfer between users
            console.log('      4. Token transfer');
            await token.transfer(user2, new BN('1000'), { from: user1 });

            // 5. Error scenario: Log error
            console.log('      5. Logging error event');
            await eventLog.log(
                startTime + 30,
                web3.utils.asciiToHex('ERROR').padEnd(18, '0'),
                web3.utils.asciiToHex('Connection failed').padEnd(66, '0'),
                { from: user1 }
            );

            // 6. Emergency: Pause system
            console.log('      6. Emergency pause');
            await eventLog.pause({ from: owner });

            // 7. Resume: Unpause system
            console.log('      7. Resume operations');
            await eventLog.unpause({ from: owner });

            // 8. Shutdown: Log shutdown event
            console.log('      8. Logging application shutdown');
            const endTime = Math.floor(Date.now() / 1000);
            await eventLog.log(
                endTime,
                web3.utils.asciiToHex('SHUTDOWN').padEnd(18, '0'),
                web3.utils.asciiToHex('App shutdown clean').padEnd(66, '0'),
                { from: owner }
            );

            // 9. Verify all events
            console.log('      9. Verifying all events');
            const allEvents = await eventLog.getPastEvents('LogEntry', {
                fromBlock: 0,
                toBlock: 'latest'
            });

            expect(allEvents.length).to.equal(5); // startup, 2 logins, error, shutdown (pause/unpause don't emit LogEntry events)

            // 10. Verify final token balances
            console.log('      10. Verifying final balances');
            const finalBalance1 = await token.balanceOf(user1);
            const finalBalance2 = await token.balanceOf(user2);

            expect(finalBalance1.toString()).to.equal('9000');
            expect(finalBalance2.toString()).to.equal('11000');

            console.log('      ✓ Application lifecycle completed successfully');
        });
    });

    describe('Cross-Contract Event Correlation', function () {
        it('should correlate token transfers with log events', async function () {
            // Transfer tokens and log at same time
            const timestamp = Math.floor(Date.now() / 1000);
            const transferAmount = new BN('5000');

            const transferReceipt = await token.transfer(user1, transferAmount, { from: owner });
            const logReceipt = await eventLog.log(
                timestamp,
                web3.utils.asciiToHex('TRANSFER').padEnd(18, '0'),
                web3.utils.asciiToHex('Sent 5000 tokens').padEnd(66, '0'),
                { from: owner }
            );

            // Verify both events in blockchain
            expect(transferReceipt.logs.length).to.be.above(0);
            expect(logReceipt.logs.length).to.be.above(0);

            // Could correlate by block number or transaction index
            expect(transferReceipt.receipt.blockNumber).to.be.closeTo(
                logReceipt.receipt.blockNumber,
                2
            );
        });
    });
});
