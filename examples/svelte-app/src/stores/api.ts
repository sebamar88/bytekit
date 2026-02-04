import { writable } from "svelte/store";
import { createApiClient } from "bytekit";

export function createApiStore(config: Parameters<typeof createApiClient>[0]) {
    const client = createApiClient(config);
    return client;
}

interface QueryState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export function createQueryStore<T>(
    client: ReturnType<typeof createApiClient>,
    url: string
) {
    const { subscribe, set, update } = writable<QueryState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    async function fetch() {
        update((state) => ({ ...state, loading: true }));

        try {
            const data = await client.get(url);
            set({ data: data as T, loading: false, error: null });
        } catch (err) {
            set({
                data: null,
                loading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            });
        }
    }

    fetch();

    return {
        subscribe,
        refetch: fetch,
    };
}
