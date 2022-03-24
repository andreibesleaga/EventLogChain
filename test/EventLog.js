var EventLog = artifacts.require('./EventLog.sol');

contract('EventLog', async accounts => {
  it("should return ok for storing a log entry, a result when getting past events", async () => {
    let contractInstance = await EventLog.deployed();

    let timestamp = Date.now();
    let entryType = 'msg_type';
    let entry = 'log_entry message';

    let resultSaveLog = await contractInstance.log.call(timestamp, web3.utils.asciiToHex(entryType), web3.utils.asciiToHex((entry)));
    let resultGetLog = await contractInstance.getPastEvents.call('allEvents', { fromBlock: 1});
    
    expect(resultSaveLog).to.not.be.undefined;
    expect(resultGetLog).to.not.be.undefined;

  });
});
