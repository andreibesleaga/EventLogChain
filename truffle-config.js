let projectId, mnemonic, projectSecret;
try {
  const secrets = require('./secrets.json');
  projectId = secrets.projectId;
  mnemonic = secrets.mnemonic;
  projectSecret = secrets.projectSecret;
} catch (e) {
  // secrets.json not found - use defaults for local development
  projectId = 'YOUR_INFURA_PROJECT_ID';
  mnemonic = 'test test test test test test test test test test test junk';
  projectSecret = 'YOUR_INFURA_PROJECT_SECRET';
}
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //

  compilers: {
    solc: {
      version: "0.8.20", // Updated to match @openzeppelin/contracts ^5.0.0 requirements
      // Can be set to "native" to use a native solc or
      // "pragma" which attempts to autodetect compiler versions
    }
  },

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${projectId}`),
      network_id: 3,       // Ropsten's id
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows: 
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  // enabled: false,
  // host: "127.0.0.1",
  // adapter: {
  //   name: "sqlite",
  //   settings: {
  //     directory: ".db"
  //   }
  // }
  // }
};
