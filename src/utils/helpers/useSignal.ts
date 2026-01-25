/**
 * React hooks for Signal integration
 * Provides useSignal, useComputed, and useSignalEffect
 * 
 * NOTE: This file requires React 16.8+ as a peer dependency
 * Install with: npm install react
 * 
 * Uncomment the code below when React is available
 */

/*
import { useState, useEffect, useRef, useReducer } from "react";
import {
    Signal,
    Computed,
    signal,
    computed,
    effect as signalEffect,
} from "./Signal.js";

export function useSignal<T>(initialValue: T): Signal<T> {
    const [sig] = useState(() => signal(initialValue));
    return sig;
}

export function useComputed<T>(compute: () => T): Computed<T> {
    const computeRef = useRef(compute);
    computeRef.current = compute;

    const [comp] = useState(() =>
        computed(() => computeRef.current())
    );

    return comp;
}

export function useSignalValue<T>(sig: Signal<T>): T {
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

    useEffect(() => {
        return sig.subscribe(forceUpdate);
    }, [sig]);

    return sig.value;
}

export function useSignalEffect(
    callback: () => void | (() => void)
): void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        return signalEffect(() => callbackRef.current());
    }, []);
}

export function useSignalFromProps<T>(value: T): Signal<T> {
    const sig = useSignal(value);

    useEffect(() => {
        sig.value = value;
    }, [value, sig]);

    return sig;
}

export function useBatch(): (callback: () => void) => void {
    return useRef((callback: () => void) => {
        import("./Signal.js").then(({ batch }) => batch(callback));
    }).current;
}
*/

// Placeholder exports to prevent build errors
export {};
