/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cryptographic utilities for hashing, encoding, and token generation
 * Isomorphic crypto operations for Node.js and browsers
 *
 * @security All cryptographic functions use secure random generation (crypto.getRandomValues)
 */

/**
 * Crypto utilities
 */
export class CryptoUtils {
    /**
     * Generate cryptographically secure random token (hex string)
     * @param length - Length of the token in bytes (default: 32)
     * @returns Hex-encoded random string
     * @security Uses crypto.getRandomValues() for secure random generation
     * @throws {Error} If crypto API is unavailable
     */
    static generateToken(length: number = 32): string {
        const bytes = new Uint8Array(length);
        if (typeof globalThis !== "undefined" && globalThis.crypto) {
            globalThis.crypto.getRandomValues(bytes);
        } else {
            throw new Error(
                "Secure random generation unavailable. crypto API required."
            );
        }
        return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    /**
     * Generate cryptographically secure UUID v4
     * @returns UUID v4 string in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     * @security Uses crypto.randomUUID() when available
     * @throws {Error} If crypto API is unavailable
     */
    static generateUUID(): string {
        if (
            typeof globalThis !== "undefined" &&
            globalThis.crypto?.randomUUID
        ) {
            return globalThis.crypto.randomUUID();
        }

        // Check if we can use getRandomValues for fallback
        /* v8 ignore start */
        if (
            typeof globalThis !== "undefined" &&
            globalThis.crypto?.getRandomValues
        ) {
            const bytes = new Uint8Array(16);
            globalThis.crypto.getRandomValues(bytes);

            // Set version (4) and variant bits
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;

            const hex = Array.from(bytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        }
        /* v8 ignore end */

        /* v8 ignore next 3 */
        throw new Error(
            "Secure random generation unavailable. crypto API required."
        );
    }

    /**
     * Base64 encode
     */
    static base64Encode(str: string): string {
        /* v8 ignore next */
        if (typeof globalThis !== "undefined" && globalThis.btoa) {
            // Encode to UTF-8 bytes first to handle Unicode characters
            const encoder = new TextEncoder();
            const bytes = encoder.encode(str);
            const binaryString = Array.from(bytes, (byte) =>
                String.fromCharCode(byte)
            ).join("");
            return globalThis.btoa(binaryString);
        }
        // Node.js fallback (unreachable: btoa is available in Node.js 18+)
        /* v8 ignore next */
        return Buffer.from(str, "utf-8").toString("base64");
    }

    /**
     * Base64 decode
     */
    static base64Decode(str: string): string {
        /* v8 ignore next */
        if (typeof globalThis !== "undefined" && globalThis.atob) {
            // Decode from binary string to UTF-8 to handle Unicode characters
            const binaryString = globalThis.atob(str);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        }
        // Node.js fallback (unreachable: atob is available in Node.js 18+)
        /* v8 ignore next */
        return Buffer.from(str, "base64").toString("utf-8");
    }

    /**
     * URL-safe base64 encode
     */
    static base64UrlEncode(str: string): string {
        return this.base64Encode(str)
            .replaceAll("+", "-")
            .replaceAll("/", "_")
            .replaceAll("=", "");
    }

    /**
     * URL-safe base64 decode
     */
    static base64UrlDecode(str: string): string {
        const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
        return this.base64Decode(
            padded.replaceAll("-", "+").replaceAll("_", "/")
        );
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
        /* v8 ignore next */
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

        // Node.js fallback (unreachable: SubtleCrypto is available in Node.js 18+)
        /* v8 ignore start */
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
        /* v8 ignore end */
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
                encoder.encode(secret) as BufferSource,
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
        /* v8 ignore start */
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
        /* v8 ignore end */
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
     * Encrypt a string using AES-256-GCM
     * @param str - Plaintext string to encrypt
     * @param key - Secret key string
     * @returns Base64 encoded string containing [iv:12bytes][ciphertext]
     * @security Uses AES-GCM with a random 96-bit IV for each encryption
     */
    static async encrypt(str: string, key: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);

        // Derive a 256-bit key from the input string using SHA-256
        const keyHash = await this.hashBytes(key);
        const subtle = globalThis.crypto.subtle as any;

        const cryptoKey = await subtle.importKey(
            "raw",
            keyHash,
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        );

        const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            data
        );

        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encrypted), iv.length);

        return this.uint8ArrayToBase64(result);
    }

    /**
     * Decrypt a string using AES-256-GCM
     * @param encryptedBase64 - Base64 encoded string containing [iv:12bytes][ciphertext]
     * @param key - Secret key string
     * @returns Decrypted plaintext string
     * @throws {Error} If decryption fails
     */
    static async decrypt(
        encryptedBase64: string,
        key: string
    ): Promise<string> {
        const combined = this.base64ToUint8Array(encryptedBase64);
        if (combined.length < 13) {
            throw new Error("Invalid encrypted data: too short");
        }

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const keyHash = await this.hashBytes(key);
        const subtle = globalThis.crypto.subtle as any;

        const cryptoKey = await subtle.importKey(
            "raw",
            keyHash,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        try {
            const decrypted = await subtle.decrypt(
                { name: "AES-GCM", iv },
                cryptoKey,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            throw new Error(`Decryption failed: ${error}`, { cause: error });
        }
    }

    /**
     * @deprecated Removed — XOR encryption is not cryptographically secure and has been
     * disabled to prevent accidental use. Use {@link encrypt} / {@link decrypt} instead.
     * @throws {Error} Always throws. Use `CryptoUtils.encrypt(str, key)` instead.
     */
    static xorEncrypt(_str: string, _key: string): never {
        throw new Error(
            "xorEncrypt has been removed because XOR encryption is not cryptographically secure. " +
            "Use CryptoUtils.encrypt(str, key) instead."
        );
    }

    /**
     * @deprecated Removed — XOR encryption is not cryptographically secure and has been
     * disabled to prevent accidental use. Use {@link encrypt} / {@link decrypt} instead.
     * @throws {Error} Always throws. Use `CryptoUtils.decrypt(encrypted, key)` instead.
     */
    static xorDecrypt(_encrypted: string, _key: string): never {
        throw new Error(
            "xorDecrypt has been removed because XOR encryption is not cryptographically secure. " +
            "Use CryptoUtils.decrypt(encrypted, key) instead."
        );
    }

    /**
     * Internal helper to hash a string and return bytes
     */
    private static async hashBytes(str: string): Promise<Uint8Array> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await globalThis.crypto.subtle.digest(
            "SHA-256",
            data
        );
        return new Uint8Array(hashBuffer);
    }

    /**
     * Internal helper for bytes to base64
     */
    private static uint8ArrayToBase64(bytes: Uint8Array): string {
        if (typeof Buffer !== "undefined") {
            return Buffer.from(bytes).toString("base64");
        }
        const binaryString = Array.from(bytes, (byte) =>
            String.fromCharCode(byte)
        ).join("");
        return globalThis.btoa(binaryString);
    }

    /**
     * Internal helper for base64 to bytes
     */
    private static base64ToUint8Array(base64: string): Uint8Array {
        if (typeof Buffer !== "undefined") {
            return new Uint8Array(Buffer.from(base64, "base64"));
        }
        const binaryString = globalThis.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Generate random bytes
     */
    static randomBytes(length: number): Uint8Array {
        const bytes = new Uint8Array(length);
        if (typeof globalThis !== "undefined" && globalThis.crypto) {
            globalThis.crypto.getRandomValues(bytes);
        } else {
            throw new Error(
                "Secure random generation unavailable. crypto API required."
            );
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
