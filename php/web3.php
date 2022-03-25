<?php
// TODO working tests
require_once "vendor/autoload.php";

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;

$RPC_ENDPOINT = '';
$ABI = '';
$CONTRACT_ADDRESS = '';

class Contract2 extends Contract {

    public function __construct($provider, $abi, $defaultBlock = 'latest') {
        parent::__construct($provider, $abi, $defaultBlock);
    }

    /**
     * getEventLogs
     * 
     * @param string $eventName
     * @param string|int $fromBlock
     * @param string|int $toBlock
     * @return array
     */
    public function getEventLogs(string $eventName, $fromBlock = 'latest', $toBlock = 'latest')
    {
        //try to ensure block numbers are valid together
        if ($fromBlock !== 'latest') {
            if (!is_int($fromBlock) || $fromBlock < 1) {
                throw new InvalidArgumentException('Please make sure fromBlock is a valid block number');
            } else if ($toBlock !== 'latest' && $fromBlock > $toBlock) {
                throw new InvalidArgumentException('Please make sure fromBlock is equal or less than toBlock');
            }
        }

        if ($toBlock !== 'latest') {
            if (!is_int($toBlock) || $toBlock < 1) {
                throw new InvalidArgumentException('Please make sure toBlock is a valid block number');
            } else if ($fromBlock === 'latest') {
                throw new InvalidArgumentException('Please make sure toBlock is equal or greater than fromBlock');
            }
        }

        $eventLogData = [];

        //ensure the event actually exists before trying to filter for it
        if (!array_key_exists($eventName, $this->events)) {
            throw new InvalidArgumentException("'{$eventName}' does not exist in the ABI for this contract");
        }

        //indexed and non-indexed event parameters must be treated separately
        //indexed parameters are stored in the 'topics' array
        //non-indexed parameters are stored in the 'data' value
        $eventParameterNames = [];
        $eventParameterTypes = [];
        $eventIndexedParameterNames = [];
        $eventIndexedParameterTypes = [];

        foreach ($this->events[$eventName]['inputs'] as $input) {
            if ($input['indexed']) {
                $eventIndexedParameterNames[] = $input['name'];
                $eventIndexedParameterTypes[] = $input['type'];
            } else {
                $eventParameterNames[] = $input['name'];
                $eventParameterTypes[] = $input['type'];
            }
        }

        $numEventIndexedParameterNames = count($eventIndexedParameterNames);

        //filter through log data to find any logs which match this event (topic) from
        //this contract, between these specified blocks (defaulting to the latest block only)
        $this->eth->getLogs([
            'fromBlock' => (is_int($fromBlock)) ? '0x' . dechex($fromBlock) : $fromBlock,
            'toBlock' => (is_int($toBlock)) ? '0x' . dechex($toBlock) : $toBlock,
            'topics' => [$this->ethabi->encodeEventSignature($this->events[$eventName])],
            'address' => $this->toAddress
        ],
        function ($error, $result) use (&$eventLogData, $eventParameterTypes, $eventParameterNames, $eventIndexedParameterTypes, $eventIndexedParameterNames) {
            if ($error !== null) {
                throw new RuntimeException($error->getMessage());
            }

            foreach ($result as $object) {
                //decode the data from the log into the expected formats, with its corresponding named key
                $decodedData = array_combine($eventParameterNames, $this->ethabi->decodeParameters($eventParameterTypes, $object->data));

                //decode the indexed parameter data
                for ($i = 0; $i < $numEventIndexedParameterNames; $i++) {
                    //topics[0] is the event signature, so we start from $i + 1 for the indexed parameter data
                    $decodedData[$eventIndexedParameterNames[$i]] = $this->ethabi->decodeParameters([$eventIndexedParameterTypes[$i]], $object->topics[$i + 1])[0];
                }

                //include block metadata for context, along with event data
                $eventLogData[] = [
                    'transactionHash' => $object->transactionHash,
                    'blockHash' => $object->blockHash,
                    'blockNumber' => hexdec($object->blockNumber),
                    'data' => $decodedData
                ];
            }
        });

        return $eventLogData;
    }

    public function ascii2hex($arg){
        return implode(" ",array_map(fn($x) => sprintf("%02s",strtoupper(dechex(ord($x)))),str_split($arg)));
    }

}


$web3 = new Web3(new HttpProvider(new HttpRequestManager($RPC_ENDPOINT)));
$contract = new Contract2($RPC_ENDPOINT, $ABI);

// log message
$logEntryType = $contract->ascii2hex('log_type');
$logEntryMsg = $contract->ascii2hex('log message');
$logTimestamp = time();

$contract->at($CONTRACT_ADDRESS)->send('log', [$logTimestamp, $logEntryType, $logEntryMsg], function ($err, $result) {
        if ($err !== null) {
            throw $err;
        }
        if ($result) {
            echo "\n function called - id: " . $result . "\n";
        }
    }
);

// get logs
$fromBlock=1;
$eth = $web3->eth;
$lastBlock = $eth->blockNumber(function ($err, $data) {
        echo "Latest block number is: ". $data . " \n";
});

$events = $contract->getEventLogs('logEntry', $fromBlock);
var_dump($events);

?>