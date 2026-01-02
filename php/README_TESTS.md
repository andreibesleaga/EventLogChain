# EventLogChain PHP Tests

## Overview

PHPUnit test suite for the EventLogChain PHP client.

## Requirements

- PHP >= 7.4
- Composer
- Running Ganache instance (for integration tests)
- Deployed contracts

## Installation

```bash
cd php
composer install
```

## Running Tests

### All Tests
```bash
composer test
```

### With Coverage
```bash
./vendor/bin/phpunit --coverage-html coverage
```

### Specific Test
```bash
./vendor/bin/phpunit tests/EventLogContractTest.php
```

## Test Coverage

The test suite includes:

### Unit Tests (EventLogContractTest.php)

1. **Connection Tests** (2 tests)
   - Contract connection validation
   - Block number retrieval

2. **Contract Validation Tests** (3 tests)
   - Address format validation
   - ABI log function presence
   - ABI LogEntry event presence

3. **Data Formatting Tests** (3 tests)
   - Hex conversion (ASCII ↔ Hex)
   - Bytes8 padding for log types
   - Bytes32 padding for messages

4. **Utility Tests** (3 tests)
   - Timestamp generation
   - Contract method existence
   - Transaction preparation

### Integration Tests (EventLogIntegrationTest.php)

1. **Blockchain Interaction Tests** (8 tests)
   - Contract instance creation
   - Past log retrieval from blockchain
   - Log data structure validation
   - Hex to string conversion
   - Bytes8/Bytes32 padding
   - Block number retrieval
   - Network ID verification

**Total: 19 tests (11 unit + 8 integration)**

## Test Structure

```
php/
├── tests/
│   ├── EventLogContractTest.php      # Unit tests (11 tests)
│   ├── EventLogIntegrationTest.php   # EventLog integration (8 tests)
│   └── TokenIntegrationTest.php      # Token integration (13 tests)
├── phpunit.xml                        # PHPUnit configuration
└── composer.json                      # Includes test script
```

## Prerequisites for Integration Tests

1. Start Ganache:
   ```bash
   npm run ganache  # In project root
   ```

2. Deploy contracts:
   ```bash
   npm run migrate  # In project root
   ```

3. Ensure `.env` has `EVENT_LOG_CONTRACT_ADDRESS` set

## Continuous Integration

Tests automatically run in CI/CD pipeline when:
- Changes are pushed to main/develop branches
- Pull requests are created

## Writing New Tests

Create new test files in the `tests/` directory:

```php
<?php

namespace EventLogChain\Tests;

use PHPUnit\Framework\TestCase;

class YourTest extends TestCase
{
    public function testSomething()
    {
        $this->assertTrue(true);
    }
}
```

## Troubleshooting

### "Contract address not set"
- Deploy contracts: `npm run migrate`
- Check `.env` file has `EVENT_LOG_CONTRACT_ADDRESS`

### "Contract ABI not found"
- Compile contracts: `npm run compile`

### "Connection refused"
- Start Ganache: `npm run ganache`
- Check RPC endpoint is `http://127.0.0.1:7545`

## Test Best Practices

1. **Isolation**: Tests should not depend on each other
2. **Cleanup**: Use `setUp()` and `tearDown()` methods
3. **Assertions**: Use specific assertions (`assertEquals`, `assertNotNull`, etc.)
4. **Documentation**: Add docblocks explaining what each test does
5. **Coverage**: Aim for >80% code coverage
