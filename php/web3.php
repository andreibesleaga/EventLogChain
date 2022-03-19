<?php
 // TO DO
require_once "vendor/autoload.php";

use Web3\Web3;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;

$web3 = new Web3(new HttpProvider(new HttpRequestManager("ADD_YOUR_ETHEREUM_NODE_URL")));

$eth = $web3->eth;

$eth->blockNumber(function ($err, $data) {
        echo "Latest block number is: ". $data . " \n";
});
?>