import { CryptoUtils } from "./CryptoUtils.js";

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface FileUploadOptions {
    onProgress?: (progress: UploadProgress) => void;
    chunkSize?: number;
    maxRetries?: number;
    timeout?: number;
    headers?: Record<string, string>;
}

export interface UploadResponse {
    success: boolean;
    fileId?: string;
    url?: string;
    error?: string;
}

export class FileUploadHelper {
    /**
     * Upload a chunk with retry logic
     */
    private static async uploadChunkWithRetry(
        chunk: Blob,
        endpoint: string,
        chunkIndex: number,
        totalChunks: number,
        headers: Record<string, string>,
        timeout: number,
        maxRetries: number
    ): Promise<void> {
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
            try {
                await this.uploadChunk(
                    chunk,
                    endpoint,
                    chunkIndex,
                    totalChunks,
                    headers,
                    timeout
                );
                success = true;
            } catch (error) {
                retries++;
                if (retries >= maxRetries) {
                    throw error;
                }
                // Exponential backoff
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.pow(2, retries) * 1000)
                );
            }
        }
    }

    /**
     * Upload a file with progress tracking and chunking support
     */
    static async uploadFile(
        file: File | Blob,
        endpoint: string,
        options: FileUploadOptions = {}
    ): Promise<UploadResponse> {
        const {
            onProgress,
            chunkSize = 5 * 1024 * 1024, // 5MB default
            maxRetries = 3,
            timeout = 30000,
            headers = {},
        } = options;

        const totalSize = file.size;
        const chunks = Math.ceil(totalSize / chunkSize);
        const uploadId = this.generateUploadId();

        try {
            for (let i = 0; i < chunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, totalSize);
                const chunk = file.slice(start, end);

                const chunkHeaders = {
                    ...headers,
                    ...(chunks > 1 ? { "X-Upload-ID": uploadId } : {}),
                };

                await this.uploadChunkWithRetry(
                    chunk,
                    endpoint,
                    i,
                    chunks,
                    chunkHeaders,
                    timeout,
                    maxRetries
                );

                if (onProgress) {
                    onProgress({
                        loaded: end,
                        total: totalSize,
                        percentage: Math.round((end / totalSize) * 100),
                    });
                }
            }

            return {
                success: true,
                fileId: uploadId,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
            };
        }
    }

    /**
     * Upload a single chunk
     */
    private static async uploadChunk(
        chunk: Blob,
        endpoint: string,
        chunkIndex: number,
        totalChunks: number,
        headers: Record<string, string>,
        timeout: number
    ): Promise<void> {
        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(totalChunks));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
                headers,
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status ${response.status}`);
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Generate a unique upload ID
     */
    private static generateUploadId(): string {
        return CryptoUtils.generateUUID();
    }

    /**
     * Validate file before upload
     */
    static validateFile(
        file: File,
        options: {
            maxSize?: number;
            allowedTypes?: string[];
            allowedExtensions?: string[];
        } = {}
    ): { valid: boolean; error?: string } {
        const {
            maxSize = 100 * 1024 * 1024, // 100MB default
            allowedTypes = [],
            allowedExtensions = [],
        } = options;

        // Check file size
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
            };
        }

        // Check MIME type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type ${file.type} is not allowed`,
            };
        }

        // Check extension
        if (allowedExtensions.length > 0) {
            const extension = file.name.split(".").pop()?.toLowerCase();
            if (!extension || !allowedExtensions.includes(extension)) {
                return {
                    valid: false,
                    error: `File extension .${extension} is not allowed`,
                };
            }
        }

        return { valid: true };
    }
}
