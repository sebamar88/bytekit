import { StreamingHelper } from "bytekit";

/**
 * Example: Processing real-time events via Server-Sent Events (SSE)
 */
async function processEvents() {
    const stream = StreamingHelper.streamSSE("https://api.example.com/events");

    const unsubscribe = stream.subscribe((data) => {
        console.log("Real-time data received:", data);
    });

    // To stop listening:
    // unsubscribe();
    // stream.close();
}

/**
 * Example: Processing large datasets via NDJSON (JSON Lines)
 * This avoids loading the entire response into memory.
 */
async function processLargeData() {
    const result = await StreamingHelper.streamJsonLines("https://api.example.com/big-data.jsonl", {
        onChunk: (item) => {
            console.log("Chunk received:", item);
        },
        onComplete: () => {
            console.log("All data processed successfully.");
        }
    });

    return result.data; // Also available as a complete array if needed
}
