# 📑 Pagination and Filtering

Efficiently handling large datasets is crucial for performance. bytekit's `ApiClient` provides built-in helpers for common pagination and filtering patterns.

## 🔹 Offset-based Pagination

This is the most common pattern, using `page` and `limit` or `offset` and `limit`.

### Basic Usage

```typescript
import { ApiClient } from "bytekit";

const api = new ApiClient({ baseUrl: "https://api.example.com" });

interface User {
    id: number;
    name: string;
}

// getList automatically structures the request and handles the response
const response = await api.getList<User>("/users", {
    pagination: {
        page: 1,
        limit: 20
    }
});

console.log(response.data); // Array of Users
console.log(response.pagination.total); // Total items count
console.log(response.pagination.totalPages);
```

### Response Structure
The `getList` method expects a standard response format from your API:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## 🔍 Filtering and Sorting

Combine pagination with complex filters and sort orders.

```typescript
const result = await api.getList<User>("/users", {
    pagination: { page: 2, limit: 10 },
    
    // Filters are converted to query parameters: ?status=active&role=admin
    filters: {
        status: "active",
        role: "admin",
        search: "John"
    },

    // Sort converted to: ?sort=createdAt&order=desc
    sort: {
        field: "createdAt",
        order: "desc"
    }
});
```

## 🖱️ Cursor-based Pagination

For real-time or infinite scroll feeds, cursor-based pagination is preferred over page numbers.

```typescript
async function fetchTimeline(cursor?: string) {
    return await api.get("/timeline", {
        searchParams: {
            limit: 50,
            after: cursor // Use the ID of the last item from the previous batch
        }
    });
}

// Initial fetch
const firstPage = await fetchTimeline();
const lastItem = firstPage.data[firstPage.data.length - 1];

// Load more
const nextPage = await fetchTimeline(lastItem.id);
```

## 💡 Best Practices

1. **Keep Filters Simple**: Avoid deep nested objects in `filters`. Stick to key-value pairs that translate well to query strings.
2. **Handle Empty States**: Always check `response.data.length` before rendering lists.
3. **Use Request Deduplication**: When implementing infinite scroll, ensure concurrent "load more" triggers are deduped using `dedupe: true` in your request options.
4. **Debounce Search Filters**: Use the `debounce` utility when binding search inputs to API filters to prevent rapid-fire requests.

```typescript
import { debounce } from "bytekit/async";

const searchUsers = debounce(async (term: string) => {
    return await api.getList("/users", { filters: { q: term } });
}, 300);
```
