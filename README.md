# EventLogChain

Ethereum blockchain remote events logger with ERC20 token support.

## Overview

EventLogChain is a decentralized event logging system built on Ethereum that allows applications to store tamper-proof event logs on the blockchain. It includes a custom ERC20 token (LOGC) and provides both JavaScript and PHP clients for easy integration.

### Features

- **Dual Timestamp System**: Records both application time and blockchain time for complete audit trails
- **Pausable Contract**: Owner can pause/unpause logging functionality
- **OpenZeppelin Security**: Uses battle-tested Pausable and Ownable contracts
- **ERC20 Token**: LogChainToken (LOGC) with mint/burn capabilities
- **Comprehensive Tests**: 75 tests passing (43 JS + 32 PHP) with >90% coverage
- **Modern Stack**: Solidity ^0.8.20, Web3@4.x, Truffle@5.x, PHPUnit@9.x

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Ganache (for local development)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd EventLogChain

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

## Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
RPC_ENDPOINT=http://127.0.0.1:7545
EVENT_LOG_CONTRACT_ADDRESS=<deployed-contract-address>
WALLET_ADDRESS=<your-wallet-address>
WALLET_PRIVATE_KEY=<your-private-key>
```

## Deployment

### Local Development (Ganache)

```bash
# Start Ganache
npm run ganache

# In another terminal, deploy contracts
npm run migrate

# Note the deployed contract addresses and update .env
```

### Test Networks

Update `truffle-config.js` with your Infura project ID and mnemonic in `secrets.json`:

```json
{
  "projectId": "YOUR_INFURA_PROJECT_ID",
  "mnemonic": "your twelve word mnemonic phrase here",
  "projectSecret": "YOUR_INFURA_PROJECT_SECRET"
}
```

Then deploy:

```bash
truffle migrate --network ropsten
```

## Usage

### Smart Contracts

#### EventLog Contract

```solidity
// Log an event (anyone can call)
function log(
    uint256 userTimestamp,  // Application timestamp
    bytes8 logEntryType,    // Event type (e.g., "success", "error")
    bytes32 logEntryMsg     // Event message
) external whenNotPaused

// Owner-only functions
function pause() external onlyOwner
function unpause() external onlyOwner
function transferOwnership(address newOwner) external onlyOwner
```

#### LogChainToken Contract

```solidity
// Standard ERC20 functions (transfer, approve, etc.)

// Owner-only minting
function mint(address to, uint256 amount) external onlyOwner

// Anyone can burn their own tokens
function burn(uint256 amount) external
```

### JavaScript Client

```bash
cd js
npm install
```

#### Query Past Events

```bash
npm run index
```

#### Send Log Entries

```bash
npm run send
```

#### Subscribe to Real-time Events

```bash
npm run subscribe
```

### PHP Client

```bash
cd php
composer install
```

See `php/web3.php` for usage examples.

## Contract Architecture

### EventLog.sol

- Inherits from OpenZeppelin's `Pausable` and `Ownable`
- **Dual Timestamp Design**: 
  - `userTimestamp`: Application-level event time (user-provided)
  - `block.timestamp`: Blockchain verification time (immutable)
  - Enables complete audit trail and offline-first applications
- Input validation on all parameters
- Emits `LogEntry` event with both timestamps

### LogChainToken.sol

- Inherits from OpenZeppelin's `ERC20` and `Ownable`
- Initial supply: 1 trillion tokens (with 2 decimals)
- Mintable by owner
- Burnable by token holders

## Testing

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Start Ganache for manual testing
npm run ganache

# Run linter
npm run lint

# Format code
npm run format
```

### Test Coverage

**Total: 75 tests (72 passing + 3 skipped)**

**JavaScript/Solidity Tests:**
- 43 tests passing
- EventLog: Deployment, logging, pause/unpause, ownership, gas consumption
- LogChainToken: Metadata, supply, transfers, minting, burning
- Integration: Cross-contract interactions, real-world scenarios

**PHP Tests:**
```bash
cd php
composer test
```

- **32 tests**: 29 passing, 3 skipped (web3.php v0.3 limitations)
- **Unit Tests (11)**: Contract connection, ABI verification, data formatting, utilities
- **EventLog Integration (8)**: Log retrieval, data structure, blockchain interaction
- **Token Integration (13)**: ERC20 metadata, supply queries, events, ABI validation

## Security

> [!WARNING]
> **This project is for educational/experimental purposes. Before production deployment:**
> - Conduct professional security audit
> - Deploy to testnet for extensive testing
> - Implement rate limiting
> - Set up monitoring and alerting
> - Consider upgradeability patterns

### Security Features

- OpenZeppelin battle-tested contracts
- Access control with Ownable
- Pausable emergency stop
- Input validation
- Comprehensive error messages
- Custom errors for gas efficiency (Solidity ^0.8.20)

## Development

### Project Structure

```
EventLogChain/
├── contracts/          # Solidity smart contracts
│   ├── EventLog.sol
│   ├── LogChainToken.sol
│   └── Migrations.sol
├── test/              # Truffle tests
│   ├── EventLog.test.js
│   └── LogChainToken.test.js
├── js/                # JavaScript client
│   ├── index.js       # Query past events
│   ├── sendToLog.js   # Send log entries
│   └── subscribe.js   # Real-time event subscription
├── php/               # PHP client
│   └── web3.php
├── migrations/        # Truffle deployment scripts
├── build/            # Compiled contracts
└── truffle-config.js # Truffle configuration
```

### Code Quality

```bash
# Lint Solidity
npm run lint

# Format code
npm run format
```

## Gas Consumption

Typical gas costs (on Ganache):

- Deploy EventLog: ~450,000 gas
- Deploy LogChainToken: ~1,200,000 gas  
- Single log entry: ~27,000 gas (with dual timestamps)

## License

MIT License - see LICENSE file

## Author

Andrei Besleaga Nicolae

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For issues and questions, please use the GitHub issue tracker.
