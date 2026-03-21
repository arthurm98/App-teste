'use client';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Defines the shape of all possible events and their corresponding payload types.
 * This centralizes event definitions for type safety across the application.
 */
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

// A generic type for a callback function.
type Callback<T> = (data: T) => void;

const PERMISSION_ERROR_DEDUPE_WINDOW_MS = 1500;

const emittedErrors = new WeakSet<object>();
const recentlyEmittedEventKeys = new Map<string, number>();

function getPermissionErrorKey(error: FirestorePermissionError) {
  return JSON.stringify(error.request);
}

function canEmitPermissionError(error: FirestorePermissionError, originalError?: unknown) {
  if (originalError && typeof originalError === 'object') {
    if (emittedErrors.has(originalError)) {
      return false;
    }

    emittedErrors.add(originalError);
  }

  const eventKey = getPermissionErrorKey(error);
  const now = Date.now();
  const lastEmissionAt = recentlyEmittedEventKeys.get(eventKey);

  recentlyEmittedEventKeys.forEach((timestamp, key) => {
    if (now - timestamp > PERMISSION_ERROR_DEDUPE_WINDOW_MS) {
      recentlyEmittedEventKeys.delete(key);
    }
  });

  if (lastEmissionAt && now - lastEmissionAt < PERMISSION_ERROR_DEDUPE_WINDOW_MS) {
    return false;
  }

  recentlyEmittedEventKeys.set(eventKey, now);
  return true;
}

/**
 * A strongly-typed pub/sub event emitter.
 * It uses a generic type T that extends a record of event names to payload types.
 */
function createEventEmitter<T extends Record<string, any>>() {
  // The events object stores arrays of callbacks, keyed by event name.
  // The types ensure that a callback for a specific event matches its payload type.
  const events: { [K in keyof T]?: Set<Callback<T[K]>> } = {};

  return {
    /**
     * Subscribe to an event.
     * @param eventName The name of the event to subscribe to.
     * @param callback The function to call when the event is emitted.
     */
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        events[eventName] = new Set();
      }
      events[eventName]?.add(callback);
    },

    /**
     * Unsubscribe from an event.
     * @param eventName The name of the event to unsubscribe from.
     * @param callback The specific callback to remove.
     */
    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        return;
      }
      events[eventName]?.delete(callback);
    },

    /**
     * Publish an event to all subscribers.
     * @param eventName The name of the event to emit.
     * @param data The data payload that corresponds to the event's type.
     */
    emit<K extends keyof T>(eventName: K, data: T[K]) {
      if (!events[eventName]) {
        return;
      }
      events[eventName]?.forEach(callback => callback(data));
    },
  };
}

// Create and export a singleton instance of the emitter, typed with our AppEvents interface.
export const errorEmitter = createEventEmitter<AppEvents>();

export function emitPermissionError(error: FirestorePermissionError, originalError?: unknown) {
  if (!canEmitPermissionError(error, originalError)) {
    return false;
  }

  errorEmitter.emit('permission-error', error);
  return true;
}
