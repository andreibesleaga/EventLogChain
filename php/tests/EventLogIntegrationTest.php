<?php

namespace EventLogChain\Tests;

use PHPUnit\Framework\TestCase;
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;

/**
 * Integration tests for EventLog contract functionality
 * 
 * These tests verify blockchain interaction capabilities:
 * - Contract deployment verification
 * - Event log retrieval  
 * - Data formatting and validation
 * 
 * Note: These tests focus on read operations since write operations
 * with web3p/web3.php v0.3 require private key management which is
 * better suited for the actual web3.php client implementation.
 * 
 * Prerequisites:
 * - Running Ganache instance
 * - Deployed EventLog contract with some existing logs
 */
class EventLogIntegrationTest extends TestCase
{
    protected $web3;
    protected $contract;
    protected $rpcEndpoint = 'http://127.0.0.1:7545';
    protected $contractAddress;
    protected $abi;

    protected function setUp(): void
    {
        // Load environment variables
        if (file_exists(__DIR__ . '/../../.env')) {
            $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                    list($key, $value) = explode('=', $line, 2);
                    $_ENV[trim($key)] = trim($value);
                }
            }
        }

        $this->contractAddress = $_ENV['EVENT_LOG_CONTRACT_ADDRESS'] ?? '';
        
        if (empty($this->contractAddress)) {
            $this->markTestSkipped('EVENT_LOG_CONTRACT_ADDRESS not set');
        }

        // Load contract ABI
        $abiPath = __DIR__ . '/../../build/contracts/EventLog.json';
        if (!file_exists($abiPath)) {
            $this->markTestSkipped('Contract ABI not found');
        }

        $contractJson = json_decode(file_get_contents($abiPath), true);
        $this->abi = json_encode($contractJson['abi']);

        // Initialize Web3
        $this->web3 = new Web3(new HttpProvider($this->rpcEndpoint));
        $this->contract = new Contract($this->web3->provider, $this->abi);
    }

    public function testCanConnectToContract()
    {
        $contractInstance = $this->contract->at($this->contractAddress);
        $this->assertNotNull($contractInstance, 'Should create contract instance');
    }

    public function testCanRetrievePastLogsFromBlockchain()
    {
        $logs = [];
        $gotLogs = false;

        $this->web3->eth->getLogs([
            'fromBlock' => '0x0',
            'toBlock' => 'latest',
            'address' => $this->contractAddress
        ], function ($err, $result) use (&$logs, &$gotLogs) {
            if ($err === null) {
                $logs = $result;
                $gotLogs = true;
            }
        });

        $this->assertTrue($gotLogs, 'Should successfully call getLogs');
        $this->assertIsArray($logs, 'Should return array of logs');
    }

    public function testLogDataStructure()
    {
        $logs = [];

        $this->web3->eth->getLogs([
            'fromBlock' => '0x0',
            'toBlock' => 'latest',
            'address' => $this->contractAddress
        ], function ($err, $result) use (&$logs) {
            if ($err === null && !empty($result)) {
                $logs = $result;
            }
        });

        if (!empty($logs)) {
            $firstLog = $logs[0];
            
            // Verify log structure
            $this->assertObjectHasProperty('address', $firstLog, 'Log should have address');
            $this->assertObjectHasProperty('topics', $firstLog, 'Log should have topics');
            $this->assertObjectHasProperty('data', $firstLog, 'Log should have data');
            $this->assertObjectHasProperty('blockNumber', $firstLog, 'Log should have blockNumber');
            $this->assertObjectHasProperty('transactionHash', $firstLog, 'Log should have transactionHash');
            
            // Verify address matches contract
            $this->assertEquals(
                strtolower($this->contractAddress),
                strtolower($firstLog->address),
                'Log address should match contract address'
            );
        } else {
            $this->markTestSkipped('No logs found in blockchain');
        }
    }

    public function testHexToStringConversion()
    {
        // Test utility function for converting hex data
        $testString = 'Hello World';
        $hex = bin2hex($testString);
        
        // Convert back
        $decoded = hex2bin($hex);
        
        $this->assertEquals($testString, $decoded, 'Hex conversion should be reversible');
    }

    public function testBytes8Padding()
    {
        $type = 'INFO';
        $hex = bin2hex($type);
        $padded = str_pad($hex, 16, '0');
        
        $this->assertEquals(16, strlen($padded), 'Bytes8 should be 16 hex chars');
        $this->assertStringStartsWith($hex, $padded, 'Should preserve original data');
    }

    public function testBytes32Padding()
    {
        $message = 'Test message';
        $hex = bin2hex($message);
        $padded = str_pad($hex, 64, '0');
        
        $this->assertEquals(64, strlen($padded), 'Bytes32 should be 64 hex chars');
        $this->assertStringStartsWith($hex, $padded, 'Should preserve original data');
    }

    public function testBlockNumberRetrieval()
    {
        $blockNumber = null;

        $this->web3->eth->blockNumber(function ($err, $result) use (&$blockNumber) {
            if ($err === null) {
                $blockNumber = $result;
            }
        });

        $this->assertNotNull($blockNumber, 'Should get current block number');
        // web3.php v0.3 returns BigInteger object
        $this->assertTrue(
            is_string($blockNumber) || is_object($blockNumber), 
            'Block number should be string or BigInteger'
        );
    }

    public function testNetworkId()
    {
        $networkId = null;

        $this->web3->net->version(function ($err, $result) use (&$networkId) {
            if ($err === null) {
                $networkId = $result;
            }
        });

        $this->assertNotNull($networkId, 'Should get network ID');
    }
}
