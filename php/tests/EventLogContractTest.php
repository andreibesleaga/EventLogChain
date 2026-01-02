<?php

namespace EventLogChain\Tests;

use PHPUnit\Framework\TestCase;
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;

/**
 * Integration tests for EventLogChain PHP client
 * 
 * These tests require a running Ganache instance and deployed contracts
 * Run: npm run ganache (in root directory)
 * Then: npm run migrate (to deploy contracts)
 */
class EventLogContractTest extends TestCase
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
            $this->markTestSkipped('EVENT_LOG_CONTRACT_ADDRESS not set in .env file. Deploy contracts first.');
        }

        // Load contract ABI
        $abiPath = __DIR__ . '/../../build/contracts/EventLog.json';
        if (!file_exists($abiPath)) {
            $this->markTestSkipped('Contract ABI not found. Compile contracts first: npm run compile');
        }

        $contractJson = json_decode(file_get_contents($abiPath), true);
        $this->abi = json_encode($contractJson['abi']);

        // Initialize Web3 with HTTP provider (v0.3 API)
        $this->web3 = new Web3(new HttpProvider($this->rpcEndpoint));
        $this->contract = new Contract($this->web3->provider, $this->abi);
    }

    public function testContractConnection()
    {
        $this->assertNotEmpty($this->contractAddress, 'Contract address should be set');
        $this->assertNotEmpty($this->abi, 'ABI should be loaded');
    }

    public function testGetBlockNumber()
    {
        $blockNumber = null;
        
        $this->web3->eth->blockNumber(function ($err, $result) use (&$blockNumber) {
            $this->assertNull($err, 'Should not have error fetching block number');
            $blockNumber = $result;
        });

        $this->assertNotNull($blockNumber, 'Block number should be retrieved');
    }

    public function testContractHasCorrectAddress()
    {
        $this->assertMatchesRegularExpression('/^0x[a-fA-F0-9]{40}$/', $this->contractAddress, 'Contract address should be valid Ethereum address');
    }

    public function testAbiContainsLogFunction()
    {
        $abiArray = json_decode($this->abi, true);
        
        $hasLogFunction = false;
        foreach ($abiArray as $item) {
            if (isset($item['name']) && $item['name'] === 'log' && $item['type'] === 'function') {
                $hasLogFunction = true;
                break;
            }
        }

        $this->assertTrue($hasLogFunction, 'ABI should contain log function');
    }

    public function testAbiContainsLogEntryEvent()
    {
        $abiArray = json_decode($this->abi, true);
        
        $hasLogEntryEvent = false;
        foreach ($abiArray as $item) {
            if (isset($item['name']) && $item['name'] === 'LogEntry' && $item['type'] === 'event') {
                $hasLogEntryEvent = true;
                break;
            }
        }

        $this->assertTrue($hasLogEntryEvent, 'ABI should contain LogEntry event');
    }

    public function testHexConversion()
    {
        $testString = 'Hello World';
        $hex = '0x' . bin2hex($testString);
        
        $this->assertEquals('0x48656c6c6f20576f726c64', $hex, 'ASCII to hex conversion should work');
        
        // Test hex to ASCII
        $decoded = hex2bin(str_replace('0x', '', $hex));
        $this->assertEquals($testString, $decoded, 'Hex to ASCII conversion should work');
    }

    public function testPaddingForBytes8()
    {
        $type = 'INFO';
        $padded = str_pad(bin2hex($type), 16, '0');
        
        $this->assertEquals(16, strlen($padded), 'Bytes8 should be 16 hex characters (8 bytes)');
        $this->assertStringStartsWith(bin2hex($type), $padded, 'Padded string should start with original');
    }

    public function testPaddingForBytes32()
    {
        $message = 'Test message';
        $padded = str_pad(bin2hex($message), 64, '0');
        
        $this->assertEquals(64, strlen($padded), 'Bytes32 should be 64 hex characters (32 bytes)');
        $this->assertStringStartsWith(bin2hex($message), $padded, 'Padded string should start with original');
    }

    public function testTimestampGeneration()
    {
        $timestamp = time();
        
        $this->assertIsInt($timestamp, 'Timestamp should be integer');
        $this->assertGreaterThan(0, $timestamp, 'Timestamp should be positive');
        $this->assertLessThan(time() + 10, $timestamp, 'Timestamp should be recent');
    }

    public function testContractMethodExists()
    {
        $contract = $this->contract->at($this->contractAddress);
        
        $this->assertNotNull($contract, 'Contract instance should be created');
    }

    /**
     * This test requires an unlocked account with ETH
     * It's commented out by default as it modifies blockchain state
     */
    public function testCanPrepareLogTransaction()
    {
        $timestamp = time();
        $logType = '0x' . str_pad(bin2hex('TEST'), 16, '0');
        $logMsg = '0x' . str_pad(bin2hex('PHP Test'), 64, '0');

        $this->assertIsInt($timestamp);
        $this->assertEquals(18, strlen($logType)); // 0x + 16 hex chars
        $this->assertEquals(66, strlen($logMsg));  // 0x + 64 hex chars
    }
}
