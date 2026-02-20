# Async Utilities - Real World Use Cases

ByteKit provides a suite of high-performance asynchronous utilities designed to simplify complex flow control.

## 1. Resilience with `retry`

The `retry` function is essential for handling flaky network connections or rate-limited APIs.

### Use Case: Polling a Transaction Status
```typescript
import { retry, AbortError } from 'bytekit/async';

async function checkPaymentStatus(id: string) {
  return await retry(async () => {
    const res = await fetch(`/api/payments/${id}`);
    const data = await res.json();
    
    if (data.status === 'PENDING') {
      throw new Error('Still processing...');
    }
    return data;
  }, {
    maxAttempts: 5,
    baseDelay: 1000,
    backoff: 'exponential',
    shouldRetry: (error) => error.message === 'Still processing...'
  });
}
```

## 2. High-Performance Batching with `parallel`

When you need to process hundreds of items but don't want to overwhelm the server or exceed browser connection limits.

### Use Case: Uploading Multiple Files with Concurrency Limit
```typescript
import { parallel } from 'bytekit/async';

const files = [file1, file2, file3, ...file100];

// Only 5 uploads will happen at the same time
const results = await parallel(
  files.map(file => () => uploadFile(file)),
  { concurrency: 5 }
);
```

## 3. UI Optimization with `debounceAsync`

Unlike standard debounce, `debounceAsync` returns a Promise that resolves when the execution finally happens.

### Use Case: Type-ahead Search with API
```typescript
import { debounceAsync } from 'bytekit/async';

const searchApi = async (query: string) => {
  const res = await fetch(`/api/search?q=${query}`);
  return res.json();
};

const debouncedSearch = debounceAsync(searchApi, 300);

// In your input handler
input.addEventListener('keyup', async (e) => {
  try {
    const results = await debouncedSearch(e.target.value);
    renderResults(results);
  } catch (err) {
    if (err.message === 'Debounced call cancelled') {
      // Ignore intermediate calls
      return;
    }
  }
});
```

## 4. Enhanced Race with `race`

Our `race` implementation is safer than `Promise.race` because it handles multiple failures gracefully using `AggregateError`.

### Use Case: Fetch with Timeout and Fallback
```typescript
import { race, sleep } from 'bytekit/async';

try {
  const result = await race([
    fetchFromPrimaryRegion(),
    fetchFromSecondaryRegion(),
    sleep(5000).then(() => { throw new Error('Timeout'); })
  ]);
} catch (error) {
  if (error instanceof AggregateError) {
    console.error('All regions failed:', error.errors);
  }
}
```
