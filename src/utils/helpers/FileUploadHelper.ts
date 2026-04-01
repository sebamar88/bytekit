import { CryptoUtils } from "./CryptoUtils.js";

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface FileUploadOptions {
    /** Called after each chunk completes with cumulative bytes loaded so far. */
    onProgress?: (progress: UploadProgress) => void;
    /**
     * Size of each chunk in bytes.
     * Values <= 0 fall back to the default.
     * @default 5242880 (5 MB)
     */
    chunkSize?: number;
    /**
     * Maximum retry attempts per chunk on failure.
     * @default 3
     */
    maxRetries?: number;
    /**
     * Per-chunk request timeout in milliseconds.
     * @default 30000
     */
    timeout?: number;
    /** Additional headers sent with every chunk request. */
    headers?: Record<string, string>;
    /**
     * 0-based chunk index to start uploading from, skipping all prior chunks.
     * Pass the `uploadedChunks` value from a previous failed {@link UploadResponse}
     * to resume an interrupted upload. Negative values are clamped to 0.
     * @default 0
     */
    resumeFrom?: number;
    /**
     * Maximum number of chunks to upload concurrently.
     * Chunks are processed in sequential batches of this size.
     * Values < 1 are clamped to 1 (sequential).
     * @default 1
     */
    concurrency?: number;
}

export interface UploadResponse {
    /** Whether the upload completed successfully (all chunks sent). */
    success: boolean;
    /** Server-assigned file identifier (currently generated client-side as a UUID). */
    fileId?: string;
    /** URL of the uploaded file, if returned by the server. */
    url?: string;
    /** Error message when `success` is `false`. */
    error?: string;
    /**
     * Number of chunks successfully uploaded (absolute count including any skipped
     * by `resumeFrom`). On success equals `totalChunks`. On failure reflects chunks
     * completed before the error — safe to pass as `resumeFrom` on the next call.
     */
    uploadedChunks?: number;
    /**
     * Total number of chunks the file was divided into at the given `chunkSize`.
     * Useful for computing resume progress or verifying chunk arithmetic.
     */
    totalChunks?: number;
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
     * Upload a file with chunking, progress tracking, resume support, and concurrency control.
     *
     * @param file - The file or blob to upload.
     * @param endpoint - Destination URL (absolute or relative).
     * @param options - Upload configuration. All fields are optional.
     * @returns Result including `uploadedChunks` and `totalChunks` for resume support.
     *
     * @example
     * ```typescript
     * // Basic chunked upload
     * const result = await FileUploadHelper.uploadFile(file, "/api/upload", {
     *   chunkSize: 1_048_576,
     *   onProgress: (p) => console.log(`${p.percentage}%`),
     * });
     *
     * // Resume an interrupted upload
     * if (!result.success) {
     *   const resumed = await FileUploadHelper.uploadFile(file, "/api/upload", {
     *     chunkSize: 1_048_576,
     *     resumeFrom: result.uploadedChunks,
     *     concurrency: 3,
     *   });
     * }
     * ```
     */
    static async uploadFile(
        file: File | Blob,
        endpoint: string,
        options: FileUploadOptions = {}
    ): Promise<UploadResponse> {
        const {
            onProgress,
            chunkSize = 5 * 1024 * 1024,
            maxRetries = 3,
            timeout = 30000,
            headers = {},
            resumeFrom = 0,
            concurrency = 1,
        } = options;

        // Clamp and validate options (D5: non-breaking defaults)
        const resolvedChunkSize = chunkSize > 0 ? chunkSize : 5 * 1024 * 1024;
        const resolvedConcurrency = Math.max(1, concurrency);
        const totalSize = file.size;
        const totalChunks = Math.ceil(totalSize / resolvedChunkSize);
        const resolvedResumeFrom = Math.max(
            0,
            Math.min(resumeFrom, totalChunks)
        );
        const uploadId = this.generateUploadId();

        // Nothing left to upload — all chunks already on the server
        if (resolvedResumeFrom >= totalChunks) {
            return {
                success: true,
                fileId: uploadId,
                uploadedChunks: totalChunks,
                totalChunks,
            };
        }

        // Pre-initialize progress baseline from already-uploaded (skipped) chunks
        let loadedBytes = Math.min(
            resolvedResumeFrom * resolvedChunkSize,
            totalSize
        );
        let uploadedChunksCount = resolvedResumeFrom;

        try {
            for (
                let batchStart = resolvedResumeFrom;
                batchStart < totalChunks;
                batchStart += resolvedConcurrency
            ) {
                const batchEnd = Math.min(
                    batchStart + resolvedConcurrency,
                    totalChunks
                );
                const batchPromises: Promise<void>[] = [];

                for (let i = batchStart; i < batchEnd; i++) {
                    const start = i * resolvedChunkSize;
                    const end = Math.min(start + resolvedChunkSize, totalSize);
                    const chunk = file.slice(start, end);
                    const chunkBytes = end - start;

                    const chunkHeaders = {
                        ...headers,
                        ...(totalChunks > 1 ? { "X-Upload-ID": uploadId } : {}),
                    };

                    batchPromises.push(
                        this.uploadChunkWithRetry(
                            chunk,
                            endpoint,
                            i,
                            totalChunks,
                            chunkHeaders,
                            timeout,
                            maxRetries
                        ).then(() => {
                            // Fires per-chunk (not per-batch) even under concurrency
                            loadedBytes += chunkBytes;
                            uploadedChunksCount++;
                            if (onProgress) {
                                onProgress({
                                    loaded: loadedBytes,
                                    total: totalSize,
                                    percentage: parseFloat(
                                        (
                                            (loadedBytes / totalSize) *
                                            100
                                        ).toFixed(2)
                                    ),
                                });
                            }
                        })
                    );
                }

                await Promise.all(batchPromises);
            }

            return {
                success: true,
                fileId: uploadId,
                uploadedChunks: uploadedChunksCount,
                totalChunks,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
                uploadedChunks: uploadedChunksCount,
                totalChunks,
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
        /* v8 ignore next */
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
