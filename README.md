# hero-sms

TypeScript library for [HeroSMS](https://hero-sms.com) SMS activation service. Compatible with SMS-Activate API protocol.

## Installation

```bash
npm install hero-sms
```

## Quick Start

```typescript
import { HeroSMSClient } from 'hero-sms';

const client = new HeroSMSClient({ 
  apiKey: 'your-api-key' 
});

// Get balance
const balance = await client.getBalance();
console.log(`Balance: $${balance}`);

// Get a number for Telegram in Kazakhstan (country: 2)
const { activationId, phoneNumber } = await client.getNumber({
  service: 'tg',
  country: 2,
});
console.log(`Phone: ${phoneNumber}, ID: ${activationId}`);

// Mark as ready to receive SMS
await client.markReady(activationId);

// Poll for SMS code
const status = await client.getStatus(activationId);
if (status.status === 'STATUS_OK') {
  console.log(`Received code: ${status.code}`);
  
  // Complete activation
  await client.complete(activationId);
}
```

## API Reference

### Constructor

```typescript
const client = new HeroSMSClient({
  apiKey: string,           // Required: Your HeroSMS API key
  baseUrl?: string,         // Optional: Custom API URL
  timeout?: number,         // Optional: Request timeout in ms (default: 30000)
});
```

### Methods

#### Balance
- `getBalance()` - Get current account balance

#### Number Management
- `getNumber(options)` - Request a phone number
- `getNumberV2(options)` - Request a phone number (returns more details)

#### Activation Status
- `setStatus(id, status)` - Change activation status
- `markReady(id)` - Mark as ready to receive SMS
- `requestResend(id)` - Request SMS resend
- `complete(id)` - Complete activation
- `cancel(id)` - Cancel and get refund
- `getStatus(id)` - Get current status
- `getStatusV2(id)` - Get status with full details
- `getActiveActivations()` - List active activations
- `getHistory(options)` - Get activation history

#### Reference Data
- `getCountries()` - Get list of countries
- `getServicesList(options)` - Get list of services
- `getOperators(country?)` - Get list of operators
- `getPrices(options)` - Get current prices
- `getTopCountriesByService(options)` - Get top countries by service
- `getTopCountriesByServiceRank(options)` - Get top countries by user rank

### GetNumber Options

```typescript
interface GetNumberOptions {
  service: string;      // Service code (e.g., 'tg', 'wa', 'ig')
  country: number;      // Country ID
  maxPrice?: number;    // Maximum price limit
  ref?: string;         // Referral identifier
  operator?: string;    // Preferred operator (comma-separated)
}
```

### Status Codes

```typescript
enum ActivationStatusCode {
  SMS_SENT = 1,        // Ready to receive SMS
  REQUEST_RESEND = 3,  // Request SMS resend
  COMPLETE = 6,        // Activation completed
  CANCEL = 8,          // Cancel activation
}
```

## Error Handling

The library throws typed errors for different scenarios:

```typescript
import { 
  HeroSMSError,
  NoNumbersError, 
  AuthenticationError,
  ActivationNotFoundError,
  EarlyCancelError,
  WrongMaxPriceError,
  BannedError 
} from 'hero-sms';

try {
  await client.getNumber({ service: 'tg', country: 2 });
} catch (error) {
  if (error instanceof NoNumbersError) {
    console.log('No numbers available');
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof WrongMaxPriceError) {
    console.log(`Min price: ${error.minimumPrice}`);
  }
}
```

## License

MIT
