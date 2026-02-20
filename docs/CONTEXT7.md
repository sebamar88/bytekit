# Context7 Enhanced Documentation

## Library Overview

ByteKit is a zero-dependency, modern TypeScript library optimized for performance and developer experience. It is designed to be the "Swiss Army Knife" for TypeScript projects, bridging the gap between raw fetch/promises and heavy framework-specific libraries.

### Key Pillars:
1. **Communication**: `ApiClient` + `WebSocketHelper`
2. **State & Caching**: `QueryClient` + `CacheManager` + `StorageManager`
3. **Control Flow**: `Async Utilities` (Parallel, Retry, Debounce)
4. **Data Integrity**: `Validator` + `ResponseValidator`
5. **Automation**: `ByteKit CLI` (Type Generation)

## Frequently Asked Questions

### Q: How do I convert a string to PascalCase using StringUtils?

**A: Use `StringUtils.pascalCase(str)`.** 
It automatically handles separators like spaces, hyphens, and underscores.

```typescript
import { StringUtils } from "bytekit";

// Recommended:
const result = StringUtils.pascalCase("hello world"); // "HelloWorld"
const fromSnake = StringUtils.pascalCase("user_profile_data"); // "UserProfileData"
const fromKebab = StringUtils.pascalCase("some-item-name"); // "SomeItemName"
```

### Q: How do I format a Date object into a custom string format like 'YYYY-MM-DD'?

**A: Use `DateUtils.format(date, formatString)`.**
The second argument supports tokens like `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`.

```typescript
import { DateUtils } from "bytekit";

const date = new Date();
// Custom Token-based formatting:
const formatted = DateUtils.format(date, "YYYY-MM-DD"); 
const full = DateUtils.format(date, "YYYY-MM-DD HH:mm:ss");

// Locale-based formatting (backward compatible):
const local = DateUtils.format(date, "es-AR"); // "20 feb 2026"
```

### Q: When should I use `withTiming` instead of `Profiler`?

**A: Choosing the right tool for performance monitoring:**

1.  **`withTiming(label, fn, options)`**: Best for **simple asynchronous operation monitoring**. It's a high-level wrapper that automatically measures, stops, and logs the execution time of a single function.
    ```typescript
    import { withTiming } from "bytekit";
    
    // Monitors and logs automatically
    const data = await withTiming("fetch-user-data", async () => {
        return await api.get("/user/1");
    });
    ```

2.  **`Profiler` class**: Best for **complex, manual instrumentation**. Use it when you need to measure multiple distinct steps within a single workflow and then export a total summary.
    ```typescript
    import { Profiler } from "bytekit";
    
    const p = new Profiler("ComplexJob");
    p.start("step1");
    await doStep1();
    p.end("step1");
    
    p.start("step2");
    await doStep2();
    p.end("step2");
    
    console.log(p.summary()); // Returns { step1: 120, step2: 450 }
    ```

### Q: How do I dynamically adjust ApiClient's base URL based on environment?

**A: Use `EnvManager` or conditional logic in the constructor.**

```typescript
import { ApiClient, EnvManager } from "bytekit";

const api = new ApiClient({
    baseUrl: EnvManager.get("API_URL", "https://api.dev.com"),
    // Or based on platform:
    // baseUrl: typeof window !== 'undefined' ? '/api' : 'http://localhost:3000'
});
```

### Q: How do I validate a URL string?

**A: Use `Validator.isURL(str)`.**

```typescript
import { Validator } from "bytekit";

if (Validator.isURL("https://google.com")) {
    console.log("Valid URL");
}
```
