<template>
    <div class="container">
        <h1>🚀 Bytekit + Vue</h1>

        <div class="example">
            <h2>API Client Example</h2>

            <p v-if="loading">Loading...</p>
            <p v-if="error" class="error">Error: {{ error }}</p>
            <pre v-if="data" class="result">{{
                JSON.stringify(data, null, 2)
            }}</pre>
        </div>

        <div class="features">
            <p>✅ Vue Composition API</p>
            <p>✅ Custom composables</p>
            <p>✅ TypeScript ready</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useApiClient, useApiQuery } from "./composables/useApi";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
}

const client = useApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
    timeoutMs: 5000,
    retryPolicy: { maxRetries: 3 },
});

const { data, loading, error } = useApiQuery<User>(client, "/users/1");
</script>

<style scoped>
.container {
    padding: 2rem;
    font-family: system-ui;
}

.example {
    margin-top: 2rem;
}

.error {
    color: red;
}

.result {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    overflow: auto;
}

.features {
    margin-top: 2rem;
    font-size: 0.9rem;
    color: #666;
}
</style>
