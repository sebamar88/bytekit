<template>
    <div class="header">
        <h1>🚀 bytekit Vue Example</h1>
        <p>Demonstrating ApiClient with Vue 3 Composition API</p>
    </div>

    <div v-if="error" class="error"><strong>Error:</strong> {{ error }}</div>

    <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <h2>Loading users...</h2>
        <p>Fetching data from JSONPlaceholder API</p>
    </div>

    <template v-else>
        <div class="card">
            <div class="stats">
                <div class="stat">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value">{{ users.length }}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Status</div>
                    <div class="stat-value">✓</div>
                </div>
            </div>

            <div style="text-align: center">
                <button @click="loadUsers" :disabled="loading">
                    {{ loading ? "Loading..." : "Refresh Data" }}
                </button>
            </div>
        </div>

        <div class="user-grid">
            <div v-for="user in users" :key="user.id" class="user-card">
                <h3>{{ user.name }}</h3>
                <p><strong>Email:</strong> {{ user.email }}</p>
                <p><strong>Phone:</strong> {{ user.phone }}</p>
                <p>
                    <strong>Website:</strong>
                    <a
                        :href="`https://${user.website}`"
                        target="_blank"
                        rel="noopener"
                    >
                        {{ user.website }}
                    </a>
                </p>
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ApiClient, ApiError } from "@sebamar88/bytekit";

// Type definitions
interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    website: string;
}

// Create API client
const api = new ApiClient({
    baseUrl: "https://jsonplaceholder.typicode.com",
    timeoutMs: 10000,
    locale: "en",
    retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 100,
    },
});

// Reactive state
const users = ref<User[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Load users function
const loadUsers = async () => {
    loading.value = true;
    error.value = null;

    try {
        const data = await api.get<User[]>("/users", {
            cache: true,
            cacheTTL: 60000, // Cache for 1 minute
        });

        users.value = data;
    } catch (err) {
        if (err instanceof ApiError) {
            error.value = `API Error: ${err.message} (${err.status})`;
        } else {
            error.value = "An unexpected error occurred";
        }
    } finally {
        loading.value = false;
    }
};

// Load on mount
onMounted(() => {
    loadUsers();
});
</script>
