/**
 * URL Builder Utility
 * Fluent API for building URLs with query parameters and fragments
 */

export class UrlBuilder {
    private url: URL;
    private queryParams: Map<string, string | string[]> = new Map();

    constructor(baseUrl: string) {
        this.url = new URL(baseUrl);
    }

    /**
     * Add path segments to the URL
     * @example
     * new UrlBuilder("https://api.example.com")
     *   .path("/users")
     *   .path("123")
     *   .build() // https://api.example.com/users/123
     */
    path(...segments: string[]): this {
        const cleanSegments = segments
            .map((s) => s.replaceAll(/^\/+|\/+$/g, ""))
            .filter(Boolean);

        if (cleanSegments.length === 0) {
            return this;
        }

        const currentPath = this.url.pathname.replace(/\/$/, "");
        this.url.pathname = [currentPath, ...cleanSegments].join("/");

        return this;
    }

    /**
     * Add query parameters
     * @example
     * new UrlBuilder("https://api.example.com")
     *   .path("/users")
     *   .query({ page: 1, limit: 10 })
     *   .query({ sort: "name" })
     *   .build() // https://api.example.com/users?page=1&limit=10&sort=name
     */
    query(
        params: Record<string, string | number | boolean | undefined | null>
    ): this {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                this.queryParams.set(key, String(value));
            }
        });
        return this;
    }

    /**
     * Add array query parameters
     * @example
     * new UrlBuilder("https://api.example.com")
     *   .path("/search")
     *   .queryArray({ tags: ["javascript", "typescript"] })
     *   .build() // https://api.example.com/search?tags=javascript&tags=typescript
     */
    queryArray(params: Record<string, (string | number | boolean)[]>): this {
        Object.entries(params).forEach(([key, values]) => {
            if (Array.isArray(values) && values.length > 0) {
                this.queryParams.set(key, values.map(String));
            }
        });
        return this;
    }

    /**
     * Set URL fragment/hash
     * @example
     * new UrlBuilder("https://example.com")
     *   .hash("section-1")
     *   .build() // https://example.com#section-1
     */
    hash(fragment: string): this {
        this.url.hash = fragment;
        return this;
    }

    /**
     * Build the final URL string
     */
    build(): string {
        const url = new URL(this.url);

        this.queryParams.forEach((value, key) => {
            if (Array.isArray(value)) {
                value.forEach((v) => url.searchParams.append(key, v));
            } else {
                url.searchParams.set(key, value);
            }
        });

        return url.toString();
    }

    /**
     * Get the URL as a URL object
     */
    toURL(): URL {
        const url = new URL(this.url);

        this.queryParams.forEach((value, key) => {
            if (Array.isArray(value)) {
                value.forEach((v) => url.searchParams.append(key, v));
            } else {
                url.searchParams.set(key, value);
            }
        });

        return url;
    }

    /**
     * Get pathname only
     */
    getPathname(): string {
        return this.url.pathname;
    }

    /**
     * Get search string (query parameters)
     */
    getSearch(): string {
        const url = this.toURL();
        return url.search;
    }

    /**
     * Get hash/fragment
     */
    getHash(): string {
        return this.url.hash;
    }

    /**
     * Clone the builder
     */
    clone(): UrlBuilder {
        const cloned = new UrlBuilder(this.url.toString());
        cloned.queryParams = new Map(this.queryParams);
        return cloned;
    }
}

/**
 * Create a new URL builder
 * @example
 * const url = createUrlBuilder("https://api.example.com")
 *   .path("/users")
 *   .query({ page: 1 })
 *   .build();
 */
export function createUrlBuilder(baseUrl: string): UrlBuilder {
    return new UrlBuilder(baseUrl);
}
