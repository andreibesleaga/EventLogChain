const { artifacts } = require('truffle');
const EventLog = artifacts.require('EventLog');
const LogChainToken = artifacts.require('LogChainToken');

/**
 * Gas Optimization Analysis Tool
 * 
 * Analyzes gas consumption for various contract operations
 * and provides optimization recommendations
 */

async function analyzeGas() {
    console.log('\n========================================');
    console.log('Gas Optimization Analysis');
    console.log('========================================\n');

    const accounts = await web3.eth.getAccounts();
    const [owner, user1] = accounts;

    // Deploy contracts
    console.log('Deploying contracts for analysis...\n');
    const eventLog = await EventLog.new({ from: owner });
    const token = await LogChainToken.new({ from: owner });

    const results = {
        deployment: {},
        eventLog: {},
        token: {},
        recommendations: []
    };

    // Deployment costs
    console.log('=== Deployment Costs ===');
    const eventLogReceipt = await web3.eth.getTransactionReceipt(eventLog.transactionHash);
    const tokenReceipt = await web3.eth.getTransactionReceipt(token.transactionHash);

    results.deployment.EventLog = eventLogReceipt.gasUsed;
    results.deployment.LogChainToken = tokenReceipt.gasUsed;

    console.log(`EventLog deployment: ${eventLogReceipt.gasUsed.toLocaleString()} gas`);
    console.log(`LogChainToken deployment: ${tokenReceipt.gasUsed.toLocaleString()} gas`);
    console.log(`Total deployment: ${(eventLogReceipt.gasUsed + tokenReceipt.gasUsed).toLocaleString()} gas\n`);

    // EventLog operations
    console.log('=== EventLog Operations ===');

    const timestamp = Math.floor(Date.now() / 1000);
    const logType = web3.utils.asciiToHex('INFO').padEnd(18, '0');
    const logMsg = web3.utils.asciiToHex('Test message').padEnd(66, '0');

    // First log (cold storage)
    let tx = await eventLog.log(timestamp, logType, logMsg, { from: user1 });
    results.eventLog.firstLog = tx.receipt.gasUsed;
    console.log(`First log entry (cold storage): ${tx.receipt.gasUsed.toLocaleString()} gas`);

    // Second log (warm storage)
    tx = await eventLog.log(timestamp + 1, logType, logMsg, { from: user1 });
    results.eventLog.subsequentLog = tx.receipt.gasUsed;
    console.log(`Subsequent log entry (warm storage): ${tx.receipt.gasUsed.toLocaleString()} gas`);
    console.log(`Savings: ${(results.eventLog.firstLog - results.eventLog.subsequentLog).toLocaleString()} gas\n`);

    // Pause operation
    tx = await eventLog.pause({ from: owner });
    results.eventLog.pause = tx.receipt.gasUsed;
    console.log(`Pause operation: ${tx.receipt.gasUsed.toLocaleString()} gas`);

    // Unpause operation
    tx = await eventLog.unpause({ from: owner });
    results.eventLog.unpause = tx.receipt.gasUsed;
    console.log(`Unpause operation: ${tx.receipt.gasUsed.toLocaleString()} gas`);

    // Ownership transfer
    tx = await eventLog.transferOwnership(user1, { from: owner });
    results.eventLog.transferOwnership = tx.receipt.gasUsed;
    console.log(`Transfer ownership: ${tx.receipt.gasUsed.toLocaleString()} gas\n`);

    // Token operations
    console.log('=== LogChainToken Operations ===');

    const transferAmount = web3.utils.toWei('100', 'ether');

    // Transfer
    tx = await token.transfer(user1, transferAmount, { from: owner });
    results.token.transfer = tx.receipt.gasUsed;
    console.log(`Transfer: ${tx.receipt.gasUsed.toLocaleString()} gas`);

    // Mint
    tx = await token.mint(user1, transferAmount, { from: owner });
    results.token.mint = tx.receipt.gasUsed;
    console.log(`Mint: ${tx.receipt.gasUsed.toLocaleString()} gas`);

    // Burn
    tx = await token.burn(transferAmount, { from: user1 });
    results.token.burn = tx.receipt.gasUsed;
    console.log(`Burn: ${tx.receipt.gasUsed.toLocaleString()} gas\n`);

    // Analysis and recommendations
    console.log('=== Analysis & Recommendations ===\n');

    if (results.eventLog.subsequentLog < results.eventLog.firstLog) {
        results.recommendations.push({
            category: 'Storage Optimization',
            finding: 'Subsequent logs use less gas due to warm storage',
            impact: `${results.eventLog.firstLog - results.eventLog.subsequentLog} gas saved per log after first`,
            recommendation: 'Consider batch logging to maximize warm storage benefits'
        });
    }

    if (results.eventLog.subsequentLog < 30000) {
        results.recommendations.push({
            category: 'Gas Efficiency',
            finding: 'Log operations are highly efficient',
            impact: `${results.eventLog.subsequentLog} gas per log is excellent`,
            recommendation: 'Current implementation is optimal for event logging'
        });
    }

    if (results.deployment.EventLog < 500000) {
        results.recommendations.push({
            category: 'Deployment Optimization',
            finding: 'EventLog deployment is compact',
            impact: `${results.deployment.EventLog} gas is efficient for functionality provided`,
            recommendation: 'Using OpenZeppelin libraries provides good size optimization'
        });
    }

    // Print recommendations
    results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.category}`);
        console.log(`   Finding: ${rec.finding}`);
        console.log(`   Impact: ${rec.impact}`);
        console.log(`   Recommendation: ${rec.recommendation}\n`);
    });

    // Cost estimates
    console.log('=== Cost Estimates (at different gas prices) ===\n');
    const gasPrice = await web3.eth.getGasPrice();
    const gasPrices = {
        current: BigInt(gasPrice),
        low: BigInt(5) * BigInt(10 ** 9), // 5 gwei
        medium: BigInt(20) * BigInt(10 ** 9), // 20 gwei
        high: BigInt(50) * BigInt(10 ** 9) // 50 gwei
    };

    Object.entries(gasPrices).forEach(([label, price]) => {
        const deploymentCost = (BigInt(results.deployment.EventLog) + BigInt(results.deployment.LogChainToken)) * price;
        const logCost = BigInt(results.eventLog.subsequentLog) * price;

        console.log(`${label.toUpperCase()} (${price / BigInt(10 ** 9)} gwei):`);
        console.log(`  Full deployment: ${web3.utils.fromWei(deploymentCost.toString(), 'ether')} ETH`);
        console.log(`  Single log entry: ${web3.utils.fromWei(logCost.toString(), 'ether')} ETH`);
        console.log(`  1000 log entries: ${web3.utils.fromWei((logCost * BigInt(1000)).toString(), 'ether')} ETH\n`);
    });

    // Save results
    const fs = require('fs');
    const path = require('path');
    const resultsPath = path.join(__dirname, '..', 'gas-report.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`✓ Gas analysis saved to: ${resultsPath}\n`);

    console.log('========================================');
    console.log('Analysis Complete');
    console.log('========================================\n');
}

// Run analysis
module.exports = async function (callback) {
    try {
        await analyzeGas();
        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};
