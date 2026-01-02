const LogChainToken = artifacts.require("./LogChainToken.sol");
const EventLog = artifacts.require("./EventLog.sol");

module.exports = function(deployer) {
    deployer.deploy(LogChainToken);
    deployer.deploy(EventLog);
};