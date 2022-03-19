var EventLog = artifacts.require('./EventLog.sol');

contract('EventLog', async accounts => {
  it("should return ok", async () => {
    let contractInstance = await EventLog.deployed();
    //let result = await contractInstance.log(Date.now(),1,10);
    let result = contractInstance.log(Date.now(), 1, 10);
    assert.equal(result, "ok");
  });

});
