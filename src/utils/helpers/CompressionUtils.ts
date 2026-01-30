/**
 * Compression utilities for data compression and encoding
 * Isomorphic compression for Node.js and browsers
 */

/**
 * Compression utilities
 */
export class CompressionUtils {
    /**
     * Compress string using LZ-like algorithm (simple)
     * For production, use proper compression libraries
     */
    static compress(str: string): string {
        let compressed = "";
        let count = 1;

        for (let i = 0; i < str.length; i++) {
            if (str[i] === str[i + 1]) {
                count++;
            } else {
                if (count > 1) {
                    compressed += count + str[i];
                } else {
                    compressed += str[i];
                }
                count = 1;
            }
        }

        return this.base64Encode(compressed);
    }

    /**
     * Decompress string
     */
    static decompress(compressed: string): string {
        const str = this.base64Decode(compressed);
        let decompressed = "";
        let i = 0;

        while (i < str.length) {
            const char = str[i];
            if (/\d/.test(char)) {
                let num = "";
                while (i < str.length && /\d/.test(str[i])) {
                    num += str[i];
                    i++;
                }
                const count = parseInt(num, 10);
                const char = str[i];
                decompressed += char.repeat(count);
                i++;
            } else {
                decompressed += char;
                i++;
            }
        }

        return decompressed;
    }

    /**
     * Base64 encode
     */
    static base64Encode(str: string): string {
        if (typeof globalThis !== "undefined" && globalThis.btoa) {
            return globalThis.btoa(str);
        }
        // Node.js fallback
        return Buffer.from(str, "utf-8").toString("base64");
    }

    /**
     * Base64 decode
     */
    static base64Decode(str: string): string {
        if (typeof globalThis !== "undefined" && globalThis.atob) {
            return globalThis.atob(str);
        }
        // Node.js fallback
        return Buffer.from(str, "base64").toString("utf-8");
    }

    /**
     * URL-safe base64 encode
     */
    static base64UrlEncode(str: string): string {
        return this.base64Encode(str)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    }

    /**
     * URL-safe base64 decode
     */
    static base64UrlDecode(str: string): string {
        const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
        return this.base64Decode(padded.replace(/-/g, "+").replace(/_/g, "/"));
    }

    /**
     * Serialize object to compressed JSON
     */
    static serializeCompressed(obj: unknown): string {
        const json = JSON.stringify(obj);
        return this.compress(json);
    }

    /**
     * Deserialize compressed JSON
     */
    static deserializeCompressed(compressed: string): unknown {
        const json = this.decompress(compressed);
        return JSON.parse(json);
    }

    /**
     * Calculate compression ratio (0-100, where 100 is best compression)
     * Returns 0 if compressed is larger than original
     */
    static getCompressionRatio(original: string, compressed: string): number {
        const ratio = (1 - compressed.length / original.length) * 100;
        return Math.max(0, ratio);
    }

    /**
     * Minify JSON (remove whitespace)
     */
    static minifyJSON(json: string): string {
        return json.replace(/\s+/g, " ").trim();
    }

    /**
     * Pretty print JSON
     */
    static prettyJSON(json: string, indent: number = 2): string {
        try {
            const obj = typeof json === "string" ? JSON.parse(json) : json;
            return JSON.stringify(obj, null, indent);
        } catch {
            return json;
        }
    }

    /**
     * Gzip compress (Node.js only)
     */
    static async gzip(str: string): Promise<Buffer | string> {
        // Only import Node.js modules in Node.js environment
        if (typeof process !== "undefined" && process.versions?.node) {
            try {
                const zlib = await import("zlib");
                const util = await import("util");
                const gzip = util.promisify(zlib.gzip);
                return await gzip(str);
            } catch {
                // Fallback to simple compression
                return this.compress(str);
            }
        }
        // Browser fallback
        return this.compress(str);
    }

    /**
     * Gzip decompress (Node.js only)
     */
    static async gunzip(data: Buffer | string): Promise<string> {
        // Only import Node.js modules in Node.js environment
        if (typeof process !== "undefined" && process.versions?.node) {
            try {
                const zlib = await import("zlib");
                const util = await import("util");
                const gunzip = util.promisify(zlib.gunzip);
                const result = await gunzip(data);
                return result.toString();
            } catch {
                // Fallback to simple decompression
                if (typeof data === "string") {
                    return this.decompress(data);
                }
                return data.toString();
            }
        }
        // Browser fallback
        if (typeof data === "string") {
            return this.decompress(data);
        }
        return data.toString();
    }

    /**
     * Deflate compress (Node.js only)
     */
    static async deflate(str: string): Promise<Buffer | string> {
        // Only import Node.js modules in Node.js environment
        if (typeof process !== "undefined" && process.versions?.node) {
            try {
                const zlib = await import("zlib");
                const util = await import("util");
                const deflate = util.promisify(zlib.deflate);
                return await deflate(str);
            } catch {
                return this.compress(str);
            }
        }
        // Browser fallback
        return this.compress(str);
    }

    /**
     * Inflate decompress (Node.js only)
     */
    static async inflate(data: Buffer | string): Promise<string> {
        // Only import Node.js modules in Node.js environment
        if (typeof process !== "undefined" && process.versions?.node) {
            try {
                const zlib = await import("zlib");
                const util = await import("util");
                const inflate = util.promisify(zlib.inflate);
                const result = await inflate(data);
                return result.toString();
            } catch {
                if (typeof data === "string") {
                    return this.decompress(data);
                }
                return data.toString();
            }
        }
        // Browser fallback
        if (typeof data === "string") {
            return this.decompress(data);
        }
        return data.toString();
    }

    /**
     * Get size in bytes
     */
    static getSize(str: string): number {
        if (typeof globalThis !== "undefined" && globalThis.Blob) {
            return new Blob([str]).size;
        }
        // Node.js fallback
        return Buffer.byteLength(str, "utf-8");
    }

    /**
     * Format bytes to human readable
     */
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
        );
    }
}
