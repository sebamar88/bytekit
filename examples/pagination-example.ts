import { ApiClient } from "bytekit";

/**
 * Example: Best way to handle paginated results and filtering
 */
export async function fetchProducts() {
    const api = new ApiClient({ baseUrl: "https://api.example.com" });

    // getList automatically handles query param construction and response structure
    const response = await api.getList("/products", {
        // Pagination: maps to ?page=1&limit=10
        pagination: {
            page: 1,
            limit: 10
        },

        // Filtering: maps to ?category=tools&minPrice=50
        filters: {
            category: "tools",
            minPrice: 50
        },

        // Sorting: maps to ?sort=price&order=asc
        sort: {
            field: "price",
            order: "asc"
        }
    });

    console.log(`Showing ${response.data.length} of ${response.pagination.total} items`);
    return response.data;
}
