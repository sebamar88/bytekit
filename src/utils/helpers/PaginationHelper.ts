/**
 * Pagination helper for managing paginated data
 * Supports offset-limit and cursor-based pagination
 */

export type PaginationMode = "offset" | "cursor";

export interface PaginationState {
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface CursorPaginationState {
    cursor?: string;
    nextCursor?: string;
    previousCursor?: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Pagination helper for managing paginated data
 */
export class PaginationHelper<T = unknown> {
    private items: T[];
    private pageSize: number;
    private mode: PaginationMode;
    private currentPage: number = 1;
    private currentCursor?: string;
    private cursorMap: Map<string, number> = new Map();

    constructor(
        items: T[],
        options: { pageSize?: number; mode?: PaginationMode } = {}
    ) {
        this.items = items;
        this.pageSize = options.pageSize ?? 10;
        this.mode = options.mode ?? "offset";
    }

    /**
     * Get current page (offset mode)
     */
    getCurrentPage(): T[] {
        if (this.mode === "cursor") {
            throw new Error("Use getCurrentPageByCursor() in cursor mode");
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.items.slice(start, end);
    }

    /**
     * Get current page by cursor (cursor mode)
     */
    getCurrentPageByCursor(): T[] {
        if (this.mode === "offset") {
            throw new Error("Use getCurrentPage() in offset mode");
        }

        const cursorIndex = this.currentCursor
            ? this.cursorMap.get(this.currentCursor) ?? 0
            : 0;
        const start = cursorIndex;
        const end = start + this.pageSize;
        return this.items.slice(start, end);
    }

    /**
     * Go to next page (offset mode)
     */
    next(): T[] {
        if (this.mode === "cursor") {
            throw new Error("Use nextByCursor() in cursor mode");
        }

        if (this.hasNextPage()) {
            this.currentPage++;
        }
        return this.getCurrentPage();
    }

    /**
     * Go to next page by cursor (cursor mode)
     */
    nextByCursor(): T[] {
        if (this.mode === "offset") {
            throw new Error("Use next() in offset mode");
        }

        const currentIndex = this.currentCursor
            ? this.cursorMap.get(this.currentCursor) ?? 0
            : 0;
        const nextIndex = currentIndex + this.pageSize;

        if (nextIndex < this.items.length) {
            this.currentCursor = this.generateCursor(nextIndex);
            this.cursorMap.set(this.currentCursor, nextIndex);
        }

        return this.getCurrentPageByCursor();
    }

    /**
     * Go to previous page (offset mode)
     */
    previous(): T[] {
        if (this.mode === "cursor") {
            throw new Error("Use previousByCursor() in cursor mode");
        }

        if (this.hasPreviousPage()) {
            this.currentPage--;
        }
        return this.getCurrentPage();
    }

    /**
     * Go to previous page by cursor (cursor mode)
     */
    previousByCursor(): T[] {
        if (this.mode === "offset") {
            throw new Error("Use previous() in offset mode");
        }

        const currentIndex = this.currentCursor
            ? this.cursorMap.get(this.currentCursor) ?? 0
            : 0;
        const previousIndex = Math.max(0, currentIndex - this.pageSize);

        if (previousIndex >= 0) {
            this.currentCursor = this.generateCursor(previousIndex);
            this.cursorMap.set(this.currentCursor, previousIndex);
        }

        return this.getCurrentPageByCursor();
    }

    /**
     * Go to specific page (offset mode)
     */
    goToPage(page: number): T[] {
        if (this.mode === "cursor") {
            throw new Error("Use goToCursor() in cursor mode");
        }

        if (page < 1) page = 1;
        if (page > this.getTotalPages()) page = this.getTotalPages();
        this.currentPage = page;
        return this.getCurrentPage();
    }

    /**
     * Go to specific cursor (cursor mode)
     */
    goToCursor(cursor: string): T[] {
        if (this.mode === "offset") {
            throw new Error("Use goToPage() in offset mode");
        }

        if (!this.cursorMap.has(cursor)) {
            const index = this.decodeCursor(cursor);
            if (index >= 0 && index < this.items.length) {
                this.cursorMap.set(cursor, index);
            }
        }

        if (this.cursorMap.has(cursor)) {
            this.currentCursor = cursor;
        }
        return this.getCurrentPageByCursor();
    }

    /**
     * Check if has next page
     */
    hasNextPage(): boolean {
        if (this.mode === "offset") {
            return this.currentPage < this.getTotalPages();
        }

        const currentIndex = this.currentCursor
            ? this.cursorMap.get(this.currentCursor) ?? 0
            : 0;
        return currentIndex + this.pageSize < this.items.length;
    }

    /**
     * Check if has previous page
     */
    hasPreviousPage(): boolean {
        if (this.mode === "offset") {
            return this.currentPage > 1;
        }

        const currentIndex = this.currentCursor
            ? this.cursorMap.get(this.currentCursor) ?? 0
            : 0;
        return currentIndex > 0;
    }

    /**
     * Get total pages (offset mode)
     */
    getTotalPages(): number {
        return Math.ceil(this.items.length / this.pageSize);
    }

    /**
     * Get total items
     */
    getTotalItems(): number {
        return this.items.length;
    }

    /**
     * Get current page number (offset mode)
     */
    getCurrentPageNumber(): number {
        return this.currentPage;
    }

    /**
     * Get pagination state (offset mode)
     */
    getState(): PaginationState {
        return {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            total: this.items.length,
            totalPages: this.getTotalPages(),
            hasNextPage: this.hasNextPage(),
            hasPreviousPage: this.hasPreviousPage(),
        };
    }

    /**
     * Get cursor pagination state (cursor mode)
     */
    getCursorState(): CursorPaginationState {
        const currentIndex = this.currentCursor
            ? this.cursorMap.get(this.currentCursor) ?? 0
            : 0;
        const nextIndex = currentIndex + this.pageSize;
        const previousIndex = Math.max(0, currentIndex - this.pageSize);

        return {
            cursor: this.currentCursor,
            nextCursor:
                nextIndex < this.items.length
                    ? this.generateCursor(nextIndex)
                    : undefined,
            previousCursor:
                currentIndex > 0
                    ? this.generateCursor(previousIndex)
                    : undefined,
            hasNextPage: nextIndex < this.items.length,
            hasPreviousPage: currentIndex > 0,
        };
    }

    /**
     * Reset to first page
     */
    reset(): void {
        this.currentPage = 1;
        this.currentCursor = undefined;
        this.cursorMap.clear();
    }

    /**
     * Set page size
     */
    setPageSize(size: number): void {
        if (size <= 0) throw new Error("Page size must be greater than 0");
        this.pageSize = size;
        this.reset();
    }

    /**
     * Generate cursor from index
     */
    private generateCursor(index: number): string {
        return Buffer.from(index.toString()).toString("base64");
    }

    /**
     * Decode cursor to index
     */
    private decodeCursor(cursor: string): number {
        try {
            return parseInt(Buffer.from(cursor, "base64").toString(), 10);
        } catch {
            return 0;
        }
    }

    /**
     * Get all items
     */
    getAllItems(): T[] {
        return [...this.items];
    }

    /**
     * Update items
     */
    setItems(items: T[]): void {
        this.items = items;
        this.reset();
    }
}

/**
 * Factory function for creating paginators
 */
export function createPaginator<T = unknown>(
    items: T[],
    options?: { pageSize?: number; mode?: PaginationMode }
): PaginationHelper<T> {
    return new PaginationHelper(items, options);
}
