var LogChainToken = artifacts.require("LogChainToken.sol");

contract('LogChainToken', async accounts => {
  it("should assert true", async function(done) {
    const LogChainTokenInstance = await LogChainToken.deployed();
    assert.isTrue(true);
    done();
  });
});
