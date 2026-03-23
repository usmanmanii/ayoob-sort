/**
 * ayoob-sort — 3–21x faster than Array.sort()
 * 
 * Auto-detects data type and picks the optimal sorting algorithm.
 * Works with numbers, floats, objects, strings, and mixed types.
 * Stable. Never mutates input. Zero config.
 * 
 * @example
 * import { sort, sortByKey } from 'ayoob-sort';
 * 
 * // Numbers (integers or floats — auto-detected)
 * sort([3, 1, 4, 1, 5])                    // → [1, 1, 3, 4, 5]
 * sort([3.14, 1.41, 2.72])                  // → [1.41, 2.72, 3.14]
 * 
 * // Objects by numeric key — up to 20x faster than .sort()
 * sortByKey(products, p => p.price)          // → sorted by price
 * sortByKey(users, u => u.createdAt)         // → sorted by timestamp
 * 
 * // Custom comparator (stable)
 * sort(data, (a, b) => b.score - a.score)    // → descending
 * 
 * // Edge cases
 * sort([5, null, NaN, undefined], { clean: true })
 */

/**
 * Sort any array. Auto-detects type and uses the fastest strategy.
 * Returns a new sorted array. Never mutates input.
 * 
 * - Numbers: adaptive counting/radix/merge sort (3–21x faster than .sort())
 * - Floats: IEEE 754 radix sort (2-3x faster than Float64Array.sort())
 * - Objects: pass a comparator or use sortByKey() for numeric keys
 * - Strings: LSD radix sort on character codes (~4x faster)
 * 
 * @param arr Array to sort
 * @param options Comparator function, { key: fn } for objects, or { clean: true } for mixed types
 * @returns New sorted array
 */
export function sort<T>(
  arr: T[],
  options?: ((a: T, b: T) => number) | 'asc' | 'desc' | 'descending' | { key?: ((item: T) => number) | string; clean?: boolean; reverse?: boolean; inPlace?: boolean }
): T[];

/**
 * Sort objects by a numeric key. Extracts keys once and sorts with
 * counting/radix sort — up to 20x faster than .sort() with a comparator.
 * Stable: equal elements preserve original order.
 * 
 * @example
 * sortByKey(products, p => p.price)
 * sortByKey(users, u => u.age)
 * sortByKey(events, e => e.timestamp)
 */
export function sortByKey<T>(arr: T[], keyFn: ((item: T) => number) | string): T[];

/**
 * Sort numbers using the adaptive engine.
 * Auto-detects integers vs floats, value range, and presortedness.
 */
export function numericSort(arr: number[]): number[];

/**
 * Sort with a custom comparator. Stable adaptive merge sort.
 */
export function sortWithComparator<T>(arr: T[], cmp: (a: T, b: T) => number): T[];

/**
 * Sort mixed arrays containing NaN, null, undefined, numbers, and strings.
 */
export function cleanSort(arr: any[]): any[];
