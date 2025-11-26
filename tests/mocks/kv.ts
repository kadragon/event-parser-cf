// GENERATED FROM Task-004: Type Safety Improvement
import { vi } from 'vitest';

/**
 * Creates a properly typed mock KVNamespace for testing
 *
 * This mock includes all standard KVNamespace methods with Vitest mocks,
 * allowing for type-safe testing without using `any` types.
 *
 * @returns A mocked KVNamespace with vi.fn() for all methods
 */
export function createMockKV(): KVNamespace {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

/**
 * Creates a mock KV with predefined responses
 *
 * @param data - Record of key-value pairs to return from get()
 * @returns A mocked KVNamespace that returns predefined data
 */
export function createMockKVWithData(
  data: Record<string, string>
): KVNamespace {
  return {
    get: vi.fn((key: string) => Promise.resolve(data[key] || null)),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}
