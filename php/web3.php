<?php
// TODO
require_once "vendor/autoload.php";

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;

$RPC_ENDPOINT = '';
$ABI = '';
$CONTRACT_ADDRESS = '';

function ascii2hex($arg){
        return implode(" ",array_map(fn($x) => sprintf("%02s",strtoupper(dechex(ord($x)))),str_split($arg)));
}

$web3 = new Web3(new HttpProvider(new HttpRequestManager($RPC_ENDPOINT)));
$contract = new Contract($RPC_ENDPOINT, $ABI);


$eth = $web3->eth;
$eth->blockNumber(function ($err, $data) {
        echo "Latest block number is: ". $data . " \n";
});

// log message
$contract->at($CONTRACT_ADDRESS)->send('log', [time(), ascii2hex("log_type"), ascii2hex('log message')], function ($err, $result) {
        if ($err !== null) {
            throw $err;
        }
        if ($result) {
            echo "\n function called - id: " . $result . "\n";
        }
    }
);


?>