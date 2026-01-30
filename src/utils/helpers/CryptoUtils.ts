/**
 * Cryptographic utilities for hashing, encoding, and token generation
 * Isomorphic crypto operations for Node.js and browsers
 */

/**
 * Crypto utilities
 */
export class CryptoUtils {
    /**
     * Generate random token (hex string)
     */
    static generateToken(length: number = 32): string {
        const bytes = new Uint8Array(length);
        if (typeof globalThis !== "undefined" && globalThis.crypto) {
            globalThis.crypto.getRandomValues(bytes);
        } else {
            // Fallback for environments without crypto
            for (let i = 0; i < length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    /**
     * Generate random UUID v4
     */
    static generateUUID(): string {
        if (
            typeof globalThis !== "undefined" &&
            globalThis.crypto?.randomUUID
        ) {
            return globalThis.crypto.randomUUID();
        }

        // Fallback implementation
        const chars = "0123456789abcdef";
        let uuid = "";
        for (let i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid += "-";
            } else if (i === 14) {
                uuid += "4";
            } else if (i === 19) {
                uuid += chars[(Math.random() * 4) | 8];
            } else {
                uuid += chars[Math.floor(Math.random() * 16)];
            }
        }
        return uuid;
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
     * Simple hash using string manipulation (not cryptographic)
     * For actual hashing, use SubtleCrypto or Node.js crypto
     */
    static simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Hash string using SubtleCrypto (browser) or crypto (Node.js)
     */
    static async hash(
        str: string,
        algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256"
    ): Promise<string> {
        if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
            // Browser
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await globalThis.crypto.subtle.digest(
                algorithm,
                data
            );
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        }

        // Node.js fallback
        if (typeof process !== "undefined" && process.versions?.node) {
            try {
                const crypto = await import("crypto");
                const hash = crypto.createHash(
                    algorithm.toLowerCase().replace("-", "")
                );
                hash.update(str);
                return hash.digest("hex");
            } catch {
                // Fallback to simple hash
                return this.simpleHash(str);
            }
        }
        // Browser without SubtleCrypto fallback
        return this.simpleHash(str);
    }

    /**
     * Create HMAC signature
     */
    static async hmac(
        message: string,
        secret: string,
        algorithm: "SHA-256" | "SHA-512" = "SHA-256"
    ): Promise<string> {
        if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
            // Browser
            const encoder = new TextEncoder();
            const key = await globalThis.crypto.subtle.importKey(
                "raw",
                encoder.encode(secret),
                { name: "HMAC", hash: algorithm },
                false,
                ["sign"]
            );
            const signature = await globalThis.crypto.subtle.sign(
                "HMAC",
                key,
                encoder.encode(message)
            );
            const signatureArray = Array.from(new Uint8Array(signature));
            return signatureArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        }

        // Node.js fallback
        if (typeof process !== "undefined" && process.versions?.node) {
            try {
                const crypto = await import("crypto");
                const hmac = crypto.createHmac(
                    algorithm.toLowerCase().replace("-", ""),
                    secret
                );
                hmac.update(message);
                return hmac.digest("hex");
            } catch {
                return "";
            }
        }
        // Browser without SubtleCrypto fallback
        return "";
    }

    /**
     * Check if string matches hash
     */
    static async verifyHash(
        str: string,
        hash: string,
        algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256"
    ): Promise<boolean> {
        const computed = await this.hash(str, algorithm);
        return computed === hash;
    }

    /**
     * Encrypt string (simple XOR - NOT for production)
     * For production, use proper encryption libraries like TweetNaCl or libsodium
     * @deprecated XOR encryption is NOT cryptographically secure. Use proper encryption libraries.
     */
    static xorEncrypt(str: string, key: string): string {
        console.warn(
            "WARNING: XOR encryption is not cryptographically secure. Use proper encryption libraries like TweetNaCl or libsodium."
        );
        let result = "";
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(
                str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return this.base64Encode(result);
    }

    /**
     * Decrypt string (simple XOR - NOT for production)
     * @deprecated XOR encryption is NOT cryptographically secure. Use proper encryption libraries.
     */
    static xorDecrypt(encrypted: string, key: string): string {
        console.warn(
            "WARNING: XOR encryption is not cryptographically secure. Use proper encryption libraries like TweetNaCl or libsodium."
        );
        const str = this.base64Decode(encrypted);
        let result = "";
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(
                str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }

    /**
     * Generate random bytes
     */
    static randomBytes(length: number): Uint8Array {
        const bytes = new Uint8Array(length);
        if (typeof globalThis !== "undefined" && globalThis.crypto) {
            globalThis.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        return bytes;
    }

    /**
     * Constant-time string comparison (prevents timing attacks)
     */
    static constantTimeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
}
