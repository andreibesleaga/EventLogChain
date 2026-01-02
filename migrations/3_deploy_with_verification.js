const fs = require('fs');
const path = require('path');

const EventLog = artifacts.require('EventLog');
const LogChainToken = artifacts.require('LogChainToken');

/**
 * Enhanced deployment script with verification
 * 
 * This script:
 * 1. Deploys EventLog and LogChainToken contracts
 * 2. Verifies deployments by calling contract functions
 * 3. Saves deployment addresses to .env file
 * 4. Tests basic functionality
 */
module.exports = async function (deployer, network, accounts) {
    const [deployer_address] = accounts;

    console.log('\n========================================');
    console.log('EventLogChain Deployment');
    console.log('========================================');
    console.log(`Network: ${network}`);
    console.log(`Deployer: ${deployer_address}`);
    console.log('========================================\n');

    // Deploy LogChainToken
    console.log('Deploying LogChainToken...');
    await deployer.deploy(LogChainToken);
    const tokenInstance = await LogChainToken.deployed();
    console.log(`✓ LogChainToken deployed at: ${tokenInstance.address}`);

    // Deploy EventLog
    console.log('\nDeploying EventLog...');
    await deployer.deploy(EventLog);
    const logInstance = await EventLog.deployed();
    console.log(`✓ EventLog deployed at: ${logInstance.address}`);

    // Verification
    console.log('\n========================================');
    console.log('Deployment Verification');
    console.log('========================================\n');

    try {
        // Verify EventLog
        console.log('Verifying EventLog...');
        const owner = await logInstance.owner();
        const paused = await logInstance.paused();
        console.log(`  Owner: ${owner}`);
        console.log(`  Paused: ${paused}`);
        console.log(`  ✓ EventLog verification passed`);

        // Verify LogChainToken
        console.log('\nVerifying LogChainToken...');
        const name = await tokenInstance.name();
        const symbol = await tokenInstance.symbol();
        const decimals = await tokenInstance.decimals();
        const totalSupply = await tokenInstance.totalSupply();
        const ownerBalance = await tokenInstance.balanceOf(deployer_address);

        console.log(`  Name: ${name}`);
        console.log(`  Symbol: ${symbol}`);
        console.log(`  Decimals: ${decimals}`);
        console.log(`  Total Supply: ${totalSupply.toString()}`);
        console.log(`  Owner Balance: ${ownerBalance.toString()}`);
        console.log(`  ✓ LogChainToken verification passed`);

        // Test basic functionality
        console.log('\n========================================');
        console.log('Testing Basic Functionality');
        console.log('========================================\n');

        // Test EventLog.log()
        console.log('Testing EventLog.log()...');
        const timestamp = Math.floor(Date.now() / 1000);
        const logType = web3.utils.asciiToHex('TEST').padEnd(18, '0');
        const logMsg = web3.utils.asciiToHex('Deployment test').padEnd(66, '0');

        const receipt = await logInstance.log(timestamp, logType, logMsg, {
            from: deployer_address
        });

        console.log(`  Transaction: ${receipt.tx}`);
        console.log(`  Gas used: ${receipt.receipt.gasUsed}`);
        console.log(`  ✓ Log entry created successfully`);

        // Save deployment info
        console.log('\n========================================');
        console.log('Saving Deployment Information');
        console.log('========================================\n');

        const deploymentInfo = {
            network,
            deployer: deployer_address,
            contracts: {
                EventLog: {
                    address: logInstance.address,
                    transactionHash: EventLog.class_defaults.from
                },
                LogChainToken: {
                    address: tokenInstance.address,
                    transactionHash: LogChainToken.class_defaults.from
                }
            },
            timestamp: new Date().toISOString()
        };

        // Save to deployments directory
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        const deploymentFile = path.join(deploymentsDir, `${network}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`✓ Deployment info saved to: ${deploymentFile}`);

        // Update .env file
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or add contract addresses
        const updateEnvVar = (content, key, value) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(content)) {
                return content.replace(regex, `${key}=${value}`);
            } else {
                return content + `\n${key}=${value}`;
            }
        };

        envContent = updateEnvVar(envContent, 'EVENT_LOG_CONTRACT_ADDRESS', logInstance.address);
        envContent = updateEnvVar(envContent, 'LOGCHAIN_TOKEN_CONTRACT_ADDRESS', tokenInstance.address);

        fs.writeFileSync(envPath, envContent.trim() + '\n');
        console.log(`✓ Updated .env with contract addresses`);

        console.log('\n========================================');
        console.log('Deployment Complete!');
        console.log('========================================');
        console.log(`\nEventLog: ${logInstance.address}`);
        console.log(`LogChainToken: ${tokenInstance.address}`);
        console.log('\nNext steps:');
        console.log('1. Run tests: npm test');
        console.log('2. Try JavaScript clients: cd js && npm install && npm run index');
        console.log('3. Try PHP client: cd php && composer install && php web3.php');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Verification failed:');
        console.error(error);
        throw error;
    }
};
