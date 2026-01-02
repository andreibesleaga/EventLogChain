# EventLogChain Architecture

## System Overview

```mermaid
graph TB
    subgraph "Client Applications"
        JS[JavaScript Client<br/>Node.js/Browser]
        PHP[PHP Client<br/>Backend]
        OTHER[Other Clients<br/>Python, Go, etc.]
    end

    subgraph "Communication Layer"
        WEB3JS[Web3.js v4.x]
        WEB3PHP[Web3.php v1.x]
        RPC[JSON-RPC]
    end

    subgraph "Blockchain Network"
        WS[WebSocket<br/>ws://localhost:7545]
        HTTP[HTTP<br/>http://localhost:7545]
        INFURA[Infura<br/>for testnets]
    end

    subgraph "Smart Contracts"
        EVENTLOG[EventLog.sol<br/>Event Logging]
        TOKEN[LogChainToken.sol<br/>ERC20 Token]
    end

    subgraph "OpenZeppelin Libraries"
        PAUSABLE[Pausable.sol]
        OWNABLE[Ownable.sol]
        ERC20[ERC20.sol]
    end

    JS --> WEB3JS
    PHP --> WEB3PHP
    OTHER --> RPC
    
    WEB3JS --> HTTP
    WEB3JS --> WS
    WEB3PHP --> HTTP
    RPC --> HTTP
    
    HTTP --> EVENTLOG
    HTTP --> TOKEN
    WS --> EVENTLOG
    INFURA --> EVENTLOG
    INFURA --> TOKEN
    
    EVENTLOG --> PAUSABLE
    EVENTLOG --> OWNABLE
    TOKEN --> ERC20
    TOKEN --> OWNABLE
```

## Component Architecture

### Smart Contracts Layer

#### EventLog Contract

```mermaid
classDiagram
    class EventLog {
        -mapping logs
        +log(uint256, bytes8, bytes32)
        +pause()
        +unpause()
        +transferOwnership(address)
        +owner() address
        +paused() bool
    }
    
    class Pausable {
        -bool _paused
        +pause()
        +unpause()
        +paused() bool
    }
    
    class Ownable {
        -address _owner
        +transferOwnership(address)
        +renounceOwnership()
        +owner() address
    }
    
    EventLog --|> Pausable
    EventLog --|> Ownable
```

**Key Features:**
- **Dual Timestamp System**: Records both user timestamp (application time) and block.timestamp (blockchain time)
- **Access Control**: Owner-only pause/unpause and ownership transfer
- **Input Validation**: Validates all parameters before logging
- **Event Emission**: Emits LogEntry events for off-chain indexing

#### LogChainToken Contract

```mermaid
classDiagram
    class LogChainToken {
        +string name
        +string symbol
        +uint8 decimals
        +uint256 totalSupply
        +transfer(address, uint256)
        +mint(address, uint256)
        +burn(uint256)
    }
    
    class ERC20 {
        +balanceOf(address) uint256
        +transfer(address, uint256) bool
        +approve(address, uint256) bool
        +transferFrom(address, address, uint256) bool
    }
    
    class Ownable {
        +transferOwnership(address)
        +owner() address
    }
    
    LogChainToken --|> ERC20
    LogChainToken --|> Ownable
```

**Key Features:**
- **ERC20 Standard**: Full compliance with ERC20 token standard
- **Mintable**: Owner can mint new tokens
- **Burnable**: Token holders can burn their tokens
- **Initial Supply**: 1 trillion tokens with 2 decimals

### Client Layer

#### JavaScript Client Architecture

```mermaid
sequenceDiagram
    participant App as Application
    participant Client as JS Client
    participant Web3 as Web3.js
    participant RPC as JSON-RPC
    participant BC as Blockchain

    App->>Client: Initialize with config
    Client->>Client: Load .env variables
    Client->>Client: Load ABI from build/
    Client->>Web3: Create instance
    
    App->>Client: sendLog(data)
    Client->>Web3: contract.methods.log()
    Web3->>RPC: eth_sendTransaction
    RPC->>BC: Submit transaction
    BC-->>RPC: Transaction hash
    RPC-->>Web3: Response
    Web3-->>Client: Receipt
    Client-->>App: Success

    App->>Client: getPastLogs()
    Client->>Web3: contract.getPastEvents()
    Web3->>RPC: eth_getLogs
    RPC->>BC: Query logs
    BC-->>RPC: Event logs
    RPC-->>Web3: Log data
    Web3-->>Client: Decoded events
    Client-->>App: Formatted logs
```

#### PHP Client Architecture

```mermaid
sequenceDiagram
    participant App as PHP Application
    participant Client as EventLogContract
    participant Web3 as Web3.php
    participant RPC as JSON-RPC
    participant BC as Blockchain

    App->>Client: new EventLogContract()
    Client->>Client: Load .env via phpdotenv
    Client->>Client: Load ABI from build/
    Client->>Web3: Initialize provider
    
    App->>Client: getEventLogs()
    Client->>Web3: eth->getLogs()
    Web3->>RPC: eth_getLogs
    RPC->>BC: Filter events
    BC-->>RPC: Matching logs
    RPC-->>Web3: Raw logs
    Web3-->>Client: Log objects
    Client->>Client: Decode parameters
    Client->>Client: Format output
    Client-->>App: Event array
```

## Data Flow

### Logging Flow

```mermaid
flowchart LR
    A[Application Event] --> B{Prepare Data}
    B --> C[User Timestamp]
    B --> D[Log Type bytes8]
    B --> E[Log Message bytes32]
    
    C --> F[Call log function]
    D --> F
    E --> F
    
    F --> G{Input Validation}
    G -->|Invalid| H[Revert with error]
    G -->|Valid| I{Contract Paused?}
    
    I -->|Yes| J[Revert EnforcedPause]
    I -->|No| K[Record block.timestamp]
    
    K --> L[Emit LogEntry Event]
    L --> M[Store in blockchain]
    L --> N[Index for queries]
```

### Event Retrieval Flow

```mermaid
flowchart LR
    A[Query Request] --> B{Specify Filters}
    B --> C[Block Range]
    B --> D[Event Type]
    B --> E[Sender Address]
    
    C --> F[RPC eth_getLogs]
    D --> F
    E -->  F
    
    F --> G[Blockchain Scan]
    G --> H[Matching Events]
    H --> I[Decode Parameters]
    I --> J{Format Output}
    
    J --> K[User Timestamp]
    J --> L[Block Timestamp]
    J --> M[Log Type UTF-8]
    J --> N[Log Message UTF-8]
    
    K --> O[Return to Client]
    L --> O
    M --> O
    N --> O
```

## Security Architecture

### Access Control Matrix

| Function | Public | Owner Only | Paused Check |
|----------|--------|------------|--------------|
| log() | ✓ | ✗ | ✓ |
| pause() | ✗ | ✓ | ✗ |
| unpause() | ✗ | ✓ | ✗ |
| transferOwnership() | ✗ | ✓ | ✗ |
| mint() | ✗ | ✓ | ✗ |
| burn() | ✓ | ✗ | ✗ |
| transfer() | ✓ | ✗ | ✗ |

### Security Layers

```mermaid
graph TD
    A[Transaction] --> B{Pausable Check}
    B -->|Paused| C[Revert]
    B -->|Active| D{Ownership Check}
    D -->|Not Owner| E[Revert]
    D -->|Is Owner| F{Input Validation}
    F -->|Invalid| G[Revert with reason]
    F -->|Valid| H[Execute Function]
    H --> I[Emit Event]
    I --> J[Update State]
```

## Deployment Architecture

### Development Environment

```
Local Dev
├── Ganache (localhost:7545)
├── Truffle (compilation & testing)
├── Web3.js/PHP clients
└── MetaMask (wallet interaction)
```

### Test Networks

```
Testnet Deployment
├── Ropsten/Sepolia
├── Infura (RPC provider)
├── HD Wallet Provider
└── Etherscan (verification)
```

### Production

```
Mainnet
├── Infura/Alchemy (RPC)
├── Multi-sig wallet (ownership)
├── Monitoring & alerts
└── Backup RPC providers
```

## Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.20
- **OpenZeppelin Contracts**: ^5.0.0
- **Truffle**: ^5.11.5

### JavaScript Client
- **Web3.js**: ^4.16.0
- **Node.js**: >=16.0.0
- **dotenv**: ^16.0.0

### PHP Client
- **web3p/web3.php**: ^1.0
- **PHP**: >=7.4
- **phpdotenv**: ^5.5

### Development Tools
- **Ganache**: Local blockchain
- **Chai**: Testing assertions
- **OpenZeppelin Test Helpers**: Testing utilities
- **Solhint**: Solidity linter
- **Prettier**: Code formatter

## Performance Characteristics

### Gas Consumption
- **EventLog deployment**: ~450,000 gas
- **LogChainToken deployment**: ~1,200,000 gas
- **log() call**: ~27,362 gas (with dual timestamps)
- **transfer() call**: ~51,000 gas (typical ERC20)

### Scalability
- **Log storage**: Optimized with events (off-chain indexing)
- **Batch operations**: Can batch multiple logs in single transaction
- **Token transfers**: Standard ERC20 scalability

## Extension Points

### Future Enhancements
1. **Log Categories**: Add categorization system
2. **Access Control Lists**: Whitelist/blacklist loggers
3. **Log Encryption**: Optional encrypted log messages
4. **Token Staking**: Stake tokens to log events
5. **Governance**: Token-based voting for contract upgrades
6. **Multi-chain**: Deploy on multiple EVM chains
7. **Layer 2**: Optimize for Polygon, Arbitrum, Optimism
