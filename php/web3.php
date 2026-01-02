<?php
/**
 * EventLogChain PHP Client
 * 
 * Example usage of web3.php to interact with EventLog smart contract
 * Updated to use stable web3p/web3.php library and environment configuration
 */

require_once __DIR__ . '/vendor/autoload.php';

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

// Configuration
$RPC_ENDPOINT = $_ENV['RPC_ENDPOINT'] ?? 'http://127.0.0.1:7545';
$CONTRACT_ADDRESS = $_ENV['EVENT_LOG_CONTRACT_ADDRESS'] ?? '';
$WALLET_ADDRESS = $_ENV['WALLET_ADDRESS'] ?? '';

if (empty($CONTRACT_ADDRESS)) {
    die("ERROR: EVENT_LOG_CONTRACT_ADDRESS not set in .env file\n");
}

// Load contract ABI
$abiPath = __DIR__ . '/../build/contracts/EventLog.json';
if (!file_exists($abiPath)) {
    die("ERROR: Contract ABI not found at {$abiPath}\nPlease compile contracts first: npm run compile\n");
}

$contractJson = json_decode(file_get_contents($abiPath), true);
$ABI = json_encode($contractJson['abi']);

/**
 * Extended Contract class with event log retrieval functionality
 */
class EventLogContract extends Contract
{
    /**
     * Get event logs from the blockchain
     *
     * @param string $eventName Name of the event to filter
     * @param int|string $fromBlock Starting block number or 'latest'
     * @param int|string $toBlock Ending block number or 'latest'
     * @return array Array of event logs
     * @throws InvalidArgumentException|RuntimeException
     */
    public function getEventLogs(string $eventName, $fromBlock = 0, $toBlock = 'latest'): array
    {
        // Validate block numbers
        if ($fromBlock !== 'latest' && (!is_int($fromBlock) || $fromBlock < 0)) {
            throw new InvalidArgumentException('fromBlock must be a valid block number or "latest"');
        }

        if ($toBlock !== 'latest' && (!is_int($toBlock) || $toBlock < 0)) {
            throw new InvalidArgumentException('toBlock must be a valid block number or "latest"');
        }

        if (is_int($fromBlock) && is_int($toBlock) && $fromBlock > $toBlock) {
            throw new InvalidArgumentException('fromBlock must be <= toBlock');
        }

        // Ensure event exists in ABI
        if (!array_key_exists($eventName, $this->events)) {
            throw new InvalidArgumentException("Event '{$eventName}' does not exist in the contract ABI");
        }

        $eventLogData = [];

        // Separate indexed and non-indexed parameters
        $regularParams = ['names' => [], 'types' => []];
        $indexedParams = ['names' => [], 'types' => []];

        foreach ($this->events[$eventName]['inputs'] as $input) {
            if ($input['indexed']) {
                $indexedParams['names'][] = $input['name'];
                $indexedParams['types'][] = $input['type'];
            } else {
                $regularParams['names'][] = $input['name'];
                $regularParams['types'][] = $input['type'];
            }
        }

        // Filter logs
        $this->eth->getLogs([
            'fromBlock' => is_int($fromBlock) ? '0x' . dechex($fromBlock) : $fromBlock,
            'toBlock' => is_int($toBlock) ? '0x' . dechex($toBlock) : $toBlock,
            'topics' => [$this->ethabi->encodeEventSignature($this->events[$eventName])],
            'address' => $this->toAddress
        ], function ($error, $result) use (&$eventLogData, $regularParams, $indexedParams) {
            if ($error !== null) {
                throw new RuntimeException('Error fetching logs: ' . $error->getMessage());
            }

            foreach ($result as $log) {
                // Decode regular parameters from data field
                $decodedData = [];
                if (!empty($regularParams['types'])) {
                    $decoded = $this->ethabi->decodeParameters(
                        $regularParams['types'],
                        $log->data
                    );
                    $decodedData = array_combine($regularParams['names'], $decoded);
                }

                // Decode indexed parameters from topics (skip topics[0] which is event signature)
                for ($i = 0; $i < count($indexedParams['names']); $i++) {
                    $decodedData[$indexedParams['names'][$i]] = $this->ethabi->decodeParameters(
                        [$indexedParams['types'][$i]],
                        $log->topics[$i + 1]
                    )[0];
                }

                $eventLogData[] = [
                    'transactionHash' => $log->transactionHash,
                    'blockHash' => $log->blockHash,
                    'blockNumber' => hexdec($log->blockNumber),
                    'data' => $decodedData
                ];
            }
        });

        return $eventLogData;
    }

    /**
     * Convert ASCII string to hex
     *
     * @param string $str ASCII string
     * @return string Hex string with 0x prefix
     */
    public function asciiToHex(string $str): string
    {
        return '0x' . bin2hex($str);
    }

    /**
     * Convert hex string to ASCII
     *
     * @param string $hex Hex string (with or without 0x prefix)
     * @return string ASCII string
     */
    public function hexToAscii(string $hex): string
    {
        $hex = str_replace('0x', '', $hex);
        $hex = str_replace('00', '', $hex); // Remove null padding
        return hex2bin($hex);
    }
}

// Example 1: Send a log entry
function sendLog($web3, $contract, $walletAddress)
{
    echo "\n=== Sending Log Entry ===\n";

    $timestamp = time();
    $logType = str_pad(bin2hex('INFO'), 16, '0'); // 8 bytes = 16 hex chars
    $logMsg = str_pad(bin2hex('Test log from PHP'), 64, '0'); // 32 bytes = 64 hex chars

    echo "Timestamp: {$timestamp}\n";
    echo "Type: INFO\n";
    echo "Message: Test log from PHP\n";

    $contract->at($GLOBALS['CONTRACT_ADDRESS'])->send('log', [
        $timestamp,
        '0x' . $logType,
        '0x' . $logMsg
    ], [
        'from' => $walletAddress,
        'gas' => '0x186A0' // 100000 gas
    ], function ($err, $txHash) {
        if ($err !== null) {
            echo "Error: " . $err->getMessage() . "\n";
            return;
        }
        echo "✓ Transaction sent: {$txHash}\n";
    });
}

// Example 2: Get past events
function getPastLogs($contract)
{
    echo "\n=== Fetching Past Log Entries ===\n";

    try {
        $events = $contract->getEventLogs('LogEntry', 0, 'latest');

        echo "Found " . count($events) . " log entries:\n\n";

        foreach ($events as $index => $event) {
            echo "Event #" . ($index + 1) . ":\n";
            echo "  Block: {$event['blockNumber']}\n";
            echo "  Transaction: {$event['transactionHash']}\n";
            echo "  Sender: {$event['data']['sender']}\n";
            echo "  User Timestamp: {$event['data']['userTimestamp']} (" . date('Y-m-d H:i:s', $event['data']['userTimestamp']) . ")\n";
            echo "  Block Timestamp: {$event['data']['blockTimestamp']} (" . date('Y-m-d H:i:s', $event['data']['blockTimestamp']) . ")\n";
            echo "  Type: " . $contract->hexToAscii($event['data']['logEntryType']) . "\n";
            echo "  Message: " . $contract->hexToAscii($event['data']['logEntryMsg']) . "\n\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

// Initialize Web3 and Contract
$web3 = new Web3(new HttpProvider(new HttpRequestManager($RPC_ENDPOINT)));
$contract = new EventLogContract($web3->provider, $ABI);

// Example usage
echo "EventLogChain PHP Client\n";
echo "========================\n";
echo "RPC Endpoint: {$RPC_ENDPOINT}\n";
echo "Contract Address: {$CONTRACT_ADDRESS}\n\n";

// Uncomment to send a log entry (requires wallet address and private key)
// if (!empty($WALLET_ADDRESS)) {
//     sendLog($web3, $contract, $WALLET_ADDRESS);
// }

// Get past events
getPastLogs($contract);

?>