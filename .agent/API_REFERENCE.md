# Bytekit API Quick Reference

> Referencia rápida de los módulos principales y sus APIs.

## 🔌 Core Modules

### ApiClient

```typescript
import { ApiClient } from 'bytekit/api-client';

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: { 'Authorization': 'Bearer token' },
  locale: 'es', // 'en' | 'es'
  retryPolicy: { maxAttempts: 3, initialDelayMs: 100 },
  errorMessages: {
    es: { 404: 'Recurso no encontrado' }
  }
});

// Methods
await client.get<T>(path, options?);
await client.post<T>(path, body, options?);
await client.put<T>(path, body, options?);
await client.patch<T>(path, body, options?);
await client.delete<T>(path, options?);
```

### Logger

```typescript
import { createLogger, Logger } from 'bytekit/logger';

const logger = createLogger({
  namespace: 'my-service',
  level: 'info' // 'debug' | 'info' | 'warn' | 'error'
});

logger.debug('Debug message', { metadata });
logger.info('Info message', { metadata });
logger.warn('Warning message', { metadata });
logger.error('Error message', { error, metadata });
```

### RetryPolicy

```typescript
import { RetryPolicy } from 'bytekit/retry-policy';

const policy = new RetryPolicy({
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
});

await policy.execute(async () => {
  return await fetch(url);
});
```

### RateLimiter

```typescript
import { RateLimiter } from 'bytekit/rate-limiter';

const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000 // 1 minute
});

if (await limiter.tryAcquire()) {
  // Request allowed
}
```

### RequestCache

```typescript
import { RequestCache } from 'bytekit/request-cache';

const cache = new RequestCache({
  ttlMs: 60000,
  maxSize: 100
});

await cache.get(key, async () => fetchData());
cache.invalidate(key);
cache.clear();
```

### ErrorBoundary

```typescript
import { ErrorBoundary, withErrorBoundary } from 'bytekit/error-boundary';

const boundary = new ErrorBoundary({
  onError: (error) => console.error(error),
  fallbackValue: defaultData
});

const result = await boundary.execute(async () => riskyOperation());

// Or as decorator pattern
const safeFn = withErrorBoundary(riskyFn, { fallback: defaultValue });
```

---

## 🛠️ Helper Modules

### DateUtils

```typescript
import { DateUtils } from 'bytekit/date-utils';

DateUtils.format(date, locale?);              // Format date
DateUtils.parse(dateString);                   // Parse string to Date
DateUtils.isValid(date);                       // Check if valid date
DateUtils.addDays(date, days);                 // Add days
DateUtils.diffInDays(date1, date2);           // Difference in days
DateUtils.startOfDay(date);                    // Start of day
DateUtils.endOfDay(date);                      // End of day
DateUtils.isToday(date);                       // Check if today
DateUtils.isPast(date);                        // Check if past
DateUtils.isFuture(date);                      // Check if future
```

### StringUtils

```typescript
import { StringUtils } from 'bytekit/string-utils';

StringUtils.slugify('Hello World!');           // 'hello-world'
StringUtils.capitalize('hello');               // 'Hello'
StringUtils.capitalizeWords('hello world');    // 'Hello World'
StringUtils.mask('1234567890', { start: 4 });  // '****567890'
StringUtils.truncate('long text', 10);         // 'long te...'
StringUtils.interpolate('Hello {name}', { name: 'World' });
StringUtils.camelCase('hello-world');          // 'helloWorld'
StringUtils.snakeCase('helloWorld');           // 'hello_world'
StringUtils.kebabCase('helloWorld');           // 'hello-world'
```

### ArrayUtils

```typescript
import { ArrayUtils } from 'bytekit/array-utils';

ArrayUtils.chunk([1,2,3,4,5], 2);              // [[1,2], [3,4], [5]]
ArrayUtils.flatten([[1,2], [3,4]]);            // [1,2,3,4]
ArrayUtils.unique([1,1,2,2,3]);                // [1,2,3]
ArrayUtils.shuffle([1,2,3,4,5]);               // Random order
ArrayUtils.zip([1,2], ['a','b']);              // [[1,'a'], [2,'b']]
ArrayUtils.groupBy(items, 'category');         // Grouped object
ArrayUtils.sortBy(items, 'name');              // Sorted array
ArrayUtils.first(array);                        // First element
ArrayUtils.last(array);                         // Last element
ArrayUtils.compact([1, null, 2, undefined]);   // [1, 2]
```

### ObjectUtils

```typescript
import { ObjectUtils } from 'bytekit/object-utils';

ObjectUtils.pick(obj, ['id', 'name']);         // Pick properties
ObjectUtils.omit(obj, ['password']);           // Omit properties
ObjectUtils.merge(obj1, obj2);                 // Deep merge
ObjectUtils.flatten(nestedObj);                // Flatten nested
ObjectUtils.unflatten(flatObj);                // Unflatten
ObjectUtils.deepClone(obj);                    // Deep clone
ObjectUtils.isEmpty(obj);                      // Check if empty
ObjectUtils.isEqual(obj1, obj2);               // Deep equality
ObjectUtils.get(obj, 'a.b.c', default);        // Safe get
ObjectUtils.set(obj, 'a.b.c', value);          // Safe set
```

### Validator

```typescript
import { Validator } from 'bytekit/validator';

Validator.isEmail('user@example.com');         // true
Validator.isUrl('https://example.com');        // true
Validator.isPhone('+1234567890');              // true
Validator.isUUID('550e8400-e29b-41d4-a716-446655440000');
Validator.isJSON('{"key": "value"}');          // true
Validator.isAlphanumeric('abc123');            // true
Validator.isNumeric('12345');                  // true
Validator.minLength(str, 5);                   // Check min length
Validator.maxLength(str, 100);                 // Check max length
Validator.matches(str, /pattern/);             // Regex match
```

### CryptoUtils

```typescript
import { CryptoUtils } from 'bytekit/crypto-utils';

CryptoUtils.uuid();                            // Generate UUID v4
CryptoUtils.randomToken(32);                   // Random token
CryptoUtils.hash(data, 'SHA-256');             // Hash data
CryptoUtils.hmac(data, key, 'SHA-256');        // HMAC
CryptoUtils.toBase64(data);                    // Encode base64
CryptoUtils.fromBase64(base64);                // Decode base64
CryptoUtils.toHex(data);                       // Encode hex
CryptoUtils.fromHex(hex);                      // Decode hex
```

### FormUtils

```typescript
import { FormUtils } from 'bytekit/form-utils';

FormUtils.serialize(formElement);              // Form to object
FormUtils.toFormData(object);                  // Object to FormData
FormUtils.toQueryString(object);               // Object to query string
FormUtils.fromQueryString(queryString);        // Query string to object
FormUtils.validate(formData, rules);           // Validate form
```

### TimeUtils

```typescript
import { TimeUtils } from 'bytekit/time-utils';

TimeUtils.sleep(1000);                         // Sleep ms
TimeUtils.debounce(fn, 300);                   // Debounce function
TimeUtils.throttle(fn, 300);                   // Throttle function
TimeUtils.timeout(promise, 5000);              // Promise with timeout
TimeUtils.retry(fn, { attempts: 3 });          // Retry function
TimeUtils.formatDuration(ms);                  // Human readable
TimeUtils.measure(async () => work());         // Measure execution
```

### UrlBuilder

```typescript
import { UrlBuilder } from 'bytekit/url-builder';

const builder = new UrlBuilder('https://api.example.com');

const url = builder
  .path('users', userId)
  .query({ page: 1, limit: 10 })
  .hash('section')
  .toString();
// https://api.example.com/users/123?page=1&limit=10#section
```

### CacheManager

```typescript
import { CacheManager } from 'bytekit/cache-manager';

const cache = new CacheManager({
  ttl: 60000,         // Time to live (ms)
  maxSize: 1000,      // Max entries
  strategy: 'lru'     // 'lru' | 'fifo'
});

cache.set(key, value);
cache.get(key);
cache.has(key);
cache.delete(key);
cache.clear();
cache.stats();                                 // { hits, misses, size }
```

---

## ⚡ Advanced Modules

### EventEmitter

```typescript
import { EventEmitter } from 'bytekit/event-emitter';

const emitter = new EventEmitter();

emitter.on('event', (data) => console.log(data));
emitter.once('event', (data) => console.log(data));
emitter.emit('event', { key: 'value' });
emitter.off('event', handler);
emitter.removeAllListeners('event');
```

### PollingHelper

```typescript
import { PollingHelper } from 'bytekit/polling-helper';

const poller = new PollingHelper({
  intervalMs: 5000,
  onPoll: async () => fetchStatus(),
  onSuccess: (data) => updateUI(data),
  onError: (error) => handleError(error)
});

poller.start();
poller.stop();
```

### WebSocketHelper

```typescript
import { WebSocketHelper } from 'bytekit/websocket';

const ws = new WebSocketHelper('wss://example.com/socket', {
  autoReconnect: true,
  reconnectIntervalMs: 1000
});

ws.on('message', (data) => console.log(data));
ws.send({ type: 'subscribe', channel: 'updates' });
ws.close();
```

### PaginationHelper

```typescript
import { PaginationHelper } from 'bytekit/pagination-helper';

const pagination = new PaginationHelper({
  totalItems: 100,
  itemsPerPage: 10,
  currentPage: 1
});

pagination.totalPages;                         // 10
pagination.hasNext;                            // true
pagination.hasPrevious;                        // false
pagination.getPageItems(items);                // Current page items
pagination.goToPage(5);                        // Navigate
```
