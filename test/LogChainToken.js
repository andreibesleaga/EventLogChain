var LogChainToken = artifacts.require("LogChainToken.sol");

contract('LogChainToken', async accounts => {
  it("should call a function that returns the token symbol after deployment", async () => {
    const LogChainTokenInstance = await LogChainToken.deployed();
    const symbol = await LogChainTokenInstance.symbol.call();
    assert.equal(symbol, 'LOGC', "LogChainToken symbol got : LOGC");
  });
});