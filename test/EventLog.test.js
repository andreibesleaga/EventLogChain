const { expect } = require('chai');
const { expectRevert, expectEvent, constants } = require('@openzeppelin/test-helpers');

const EventLog = artifacts.require('EventLog');

contract('EventLog', function (accounts) {
    const [owner, user1, user2] = accounts;
    let eventLog;

    beforeEach(async function () {
        eventLog = await EventLog.new({ from: owner });
    });

    describe('Deployment', function () {
        it('should set the correct owner', async function () {
            expect(await eventLog.owner()).to.equal(owner);
        });

        it('should start in unpaused state', async function () {
            expect(await eventLog.paused()).to.be.false;
        });
    });

    describe('Logging functionality', function () {
        const userTimestamp = Math.floor(Date.now() / 1000);
        const logType = web3.utils.asciiToHex('INFO').padEnd(18, '0');
        const logMsg = web3.utils.asciiToHex('Test message').padEnd(66, '0');

        it('should allow users to log events with both timestamps', async function () {
            const receipt = await eventLog.log(userTimestamp, logType, logMsg, { from: user1 });

            expectEvent(receipt, 'LogEntry', {
                sender: user1,
                userTimestamp: userTimestamp.toString(),
                logEntryMsg: logMsg
            });
        });

        it('should record both user timestamp and block timestamp', async function () {
            const receipt = await eventLog.log(userTimestamp, logType, logMsg, { from: user1 });
            const event = receipt.logs[0];
            const block = await web3.eth.getBlock(receipt.receipt.blockNumber);

            // Verify user-provided timestamp is stored
            expect(event.args.userTimestamp.toString()).to.equal(userTimestamp.toString());

            // Verify block.timestamp is also stored
            expect(event.args.blockTimestamp.toString()).to.equal(block.timestamp.toString());
        });

        it('should reject zero timestamp', async function () {
            await expectRevert(
                eventLog.log(0, logType, logMsg, { from: user1 }),
                'EventLog: timestamp cannot be zero'
            );
        });

        it('should reject empty log type', async function () {
            await expectRevert(
                eventLog.log(userTimestamp, '0x0000000000000000', logMsg, { from: user1 }),
                'EventLog: type cannot be empty'
            );
        });

        it('should reject empty log message', async function () {
            await expectRevert(
                eventLog.log(userTimestamp, logType, constants.ZERO_BYTES32, { from: user1 }),
                'EventLog: message cannot be empty'
            );
        });

        it('should allow different user timestamps but same block timestamp', async function () {
            const userTimestamp1 = Math.floor(Date.now() / 1000);
            const userTimestamp2 = userTimestamp1 + 100; // 100 seconds later in app time

            const receipt1 = await eventLog.log(userTimestamp1, logType, logMsg, { from: user1 });
            const receipt2 = await eventLog.log(userTimestamp2, logType, logMsg, { from: user1 });

            const event1 = receipt1.logs[0];
            const event2 = receipt2.logs[0];

            // User timestamps should be different
            expect(event1.args.userTimestamp.toString()).to.not.equal(event2.args.userTimestamp.toString());

            // Block timestamps might be the same (if in same block)
            // This demonstrates the value of having both timestamps
        });
    });

    describe('Pause functionality', function () {
        const userTimestamp = Math.floor(Date.now() / 1000);
        const logType = web3.utils.asciiToHex('INFO').padEnd(18, '0');
        const logMsg = web3.utils.asciiToHex('Test').padEnd(66, '0');

        it('should allow owner to pause', async function () {
            const receipt = await eventLog.pause({ from: owner });
            expect(await eventLog.paused()).to.be.true;
            expectEvent(receipt, 'ContractPaused', { by: owner });
        });

        it('should not allow non-owner to pause', async function () {
            await expectRevert.unspecified(
                eventLog.pause({ from: user1 })
            );
        });

        it('should prevent logging when paused', async function () {
            await eventLog.pause({ from: owner });
            await expectRevert.unspecified(
                eventLog.log(userTimestamp, logType, logMsg, { from: user1 })
            );
        });

        it('should allow owner to unpause', async function () {
            await eventLog.pause({ from: owner });
            const receipt = await eventLog.unpause({ from: owner });
            expect(await eventLog.paused()).to.be.false;
            expectEvent(receipt, 'ContractUnpaused', { by: owner });
        });

        it('should allow logging after unpause', async function () {
            await eventLog.pause({ from: owner });
            await eventLog.unpause({ from: owner });
            const receipt = await eventLog.log(userTimestamp, logType, logMsg, { from: user1 });
            expectEvent(receipt, 'LogEntry');
        });
    });

    describe('Ownership', function () {
        it('should allow owner to transfer ownership', async function () {
            await eventLog.transferOwnership(user1, { from: owner });
            expect(await eventLog.owner()).to.equal(user1);
        });

        it('should not allow non-owner to transfer ownership', async function () {
            await expectRevert.unspecified(
                eventLog.transferOwnership(user2, { from: user1 })
            );
        });
    });

    describe('Gas consumption', function () {
        it('should log gas cost for single log entry with dual timestamps', async function () {
            const userTimestamp = Math.floor(Date.now() / 1000);
            const logType = web3.utils.asciiToHex('INFO').padEnd(18, '0');
            const logMsg = web3.utils.asciiToHex('Test').padEnd(66, '0');
            const receipt = await eventLog.log(userTimestamp, logType, logMsg, { from: user1 });

            console.log(`      Gas used for log() with dual timestamps: ${receipt.receipt.gasUsed}`);
            expect(receipt.receipt.gasUsed).to.be.below(120000); // Slightly higher due to extra timestamp
        });
    });
});
