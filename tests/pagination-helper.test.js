import test from "node:test";
import assert from "node:assert/strict";
import { PaginationHelper, createPaginator } from "../dist/utils/helpers/PaginationHelper.js";

// ============================================================================
// PaginationHelper Tests
// ============================================================================

test("PaginationHelper offset mode basic operations", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10 });
    
    assert.equal(paginator.getTotalItems(), 25);
    assert.equal(paginator.getTotalPages(), 3);
    assert.equal(paginator.getCurrentPageNumber(), 1);
    
    const page1 = paginator.getCurrentPage();
    assert.equal(page1.length, 10);
    assert.equal(page1[0], 1);
    assert.equal(page1[9], 10);
    
    paginator.next();
    assert.equal(paginator.getCurrentPageNumber(), 2);
    
    const page2 = paginator.getCurrentPage();
    assert.equal(page2[0], 11);
    
    paginator.previous();
    assert.equal(paginator.getCurrentPageNumber(), 1);
    
    paginator.goToPage(3);
    assert.equal(paginator.getCurrentPageNumber(), 3);
    assert.equal(paginator.getCurrentPage().length, 5);
});

test("PaginationHelper cursor mode basic operations", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10, mode: "cursor" });
    
    const page1 = paginator.getCurrentPageByCursor();
    assert.equal(page1.length, 10);
    assert.equal(page1[0], 1);
    
    const state1 = paginator.getCursorState();
    assert.ok(state1.hasNextPage);
    assert.ok(!state1.hasPreviousPage);
    assert.ok(state1.nextCursor);
    
    paginator.nextByCursor();
    const page2 = paginator.getCurrentPageByCursor();
    assert.equal(page2[0], 11);
    
    const state2 = paginator.getCursorState();
    assert.ok(state2.hasNextPage);
    assert.ok(state2.hasPreviousPage);
    assert.ok(state2.previousCursor);
    
    paginator.previousByCursor();
    assert.equal(paginator.getCurrentPageByCursor()[0], 1);
});

test("PaginationHelper throws when using wrong mode methods", () => {
    const items = [1, 2, 3];
    const offsetPaginator = new PaginationHelper(items, { mode: "offset" });
    const cursorPaginator = new PaginationHelper(items, { mode: "cursor" });
    
    assert.throws(() => offsetPaginator.getCurrentPageByCursor(), /Use getCurrentPage\(\) in offset mode/);
    assert.throws(() => offsetPaginator.nextByCursor(), /Use next\(\) in offset mode/);
    assert.throws(() => offsetPaginator.previousByCursor(), /Use previous\(\) in offset mode/);
    assert.throws(() => offsetPaginator.goToCursor("abc"), /Use goToPage\(\) in offset mode/);
    
    assert.throws(() => cursorPaginator.getCurrentPage(), /Use getCurrentPageByCursor\(\) in cursor mode/);
    assert.throws(() => cursorPaginator.next(), /Use nextByCursor\(\) in cursor mode/);
    assert.throws(() => cursorPaginator.previous(), /Use previousByCursor\(\) in cursor mode/);
    assert.throws(() => cursorPaginator.goToPage(1), /Use goToCursor\(\) in cursor mode/);
});

test("PaginationHelper.goToPage bounds checking", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10 });
    
    paginator.goToPage(0);
    assert.equal(paginator.getCurrentPageNumber(), 1);
    
    paginator.goToPage(10);
    assert.equal(paginator.getCurrentPageNumber(), 3);
});

test("PaginationHelper.goToCursor navigates correctly", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10, mode: "cursor" });
    
    const state = paginator.getCursorState();
    const nextCursor = state.nextCursor;
    
    paginator.goToCursor(nextCursor);
    assert.equal(paginator.getCurrentPageByCursor()[0], 11);
});

test("PaginationHelper.setPageSize resets state", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10 });
    
    paginator.next();
    assert.equal(paginator.getCurrentPageNumber(), 2);
    
    paginator.setPageSize(5);
    assert.equal(paginator.getCurrentPageNumber(), 1);
    assert.equal(paginator.getCurrentPage().length, 5);
    
    assert.throws(() => paginator.setPageSize(0), /Page size must be greater than 0/);
});

test("PaginationHelper.setItems updates data and resets state", () => {
    const paginator = new PaginationHelper([1, 2, 3]);
    paginator.setItems([4, 5, 6, 7, 8]);
    assert.equal(paginator.getTotalItems(), 5);
    assert.equal(paginator.getAllItems().length, 5);
});

test("PaginationHelper.getState and getCursorState return full state", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const paginator = new PaginationHelper(items, { pageSize: 10 });
    
    const state = paginator.getState();
    assert.equal(state.total, 25);
    assert.equal(state.totalPages, 3);
    assert.equal(state.hasNextPage, true);
    
    const cursorPaginator = new PaginationHelper(items, { pageSize: 10, mode: "cursor" });
    const cursorState = cursorPaginator.getCursorState();
    assert.ok("hasNextPage" in cursorState);
});

test("PaginationHelper.goToCursor handles invalid cursors", () => {
    const paginator = new PaginationHelper([1, 2, 3], { mode: "cursor" });
    const originalPage = paginator.getCurrentPageByCursor();
    
    // Invalid cursor (not in map, not decodable base64)
    paginator.goToCursor("invalid!!!!");
    assert.deepEqual(paginator.getCurrentPageByCursor(), originalPage);
    
    // Valid base64 but invalid index
    const invalidIndexCursor = Buffer.from("999").toString("base64");
    paginator.goToCursor(invalidIndexCursor);
    assert.deepEqual(paginator.getCurrentPageByCursor(), originalPage);
});

test("PaginationHelper.decodeCursor handles malformed data", () => {
    const paginator = new PaginationHelper([1, 2, 3], { mode: "cursor" });
    // This triggers the try-catch in decodeCursor
    // Actually, Buffer.from(..., 'base64') doesn't throw easily, but let's try a very weird string
    // @ts-ignore
    const index = paginator.decodeCursor(undefined);
    assert.equal(index, 0);
});

