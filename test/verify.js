/**
 * Independent verification tests for ayoob-sort.
 * Tests every code path, edge case, and correctness property.
 */
const { sort, sortByKey, numericSort, sortWithComparator, cleanSort,
        _stableCountingSort, _stableRadixSort, _stableAdaptiveMergeSort, _sortNetwork } = require('../src/index.js');

let pass = 0, fail = 0, section = '';
function test(name, condition) {
  if (condition) { pass++; }
  else { fail++; console.log(`  FAIL [${section}] ${name}`); }
}
function group(name) { section = name; console.log(`\n── ${name} ──`); }

// Helper: verify sorted correctly against native reference
function verifySorted(input, result) {
  const expected = input.slice().sort((a, b) => a - b);
  if (result.length !== expected.length) return false;
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== expected[i]) return false;
  }
  return true;
}

// Helper: check array not mutated
function checkImmutable(arr) {
  const copy = arr.slice();
  sort(arr);
  if (arr.length !== copy.length) return false;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== copy[i]) return false;
  }
  return true;
}

// ════════════════════════════════════════════════════════
// PATH 1: Sorting networks (n <= 8)
// ════════════════════════════════════════════════════════
group('Sorting Networks (n <= 8)');

test('empty array', JSON.stringify(sort([])) === '[]');
test('single element', JSON.stringify(sort([42])) === '[42]');
test('n=2 sorted', JSON.stringify(sort([1, 2])) === '[1,2]');
test('n=2 reversed', JSON.stringify(sort([2, 1])) === '[1,2]');
test('n=2 equal', JSON.stringify(sort([5, 5])) === '[5,5]');
test('n=3 sorted', JSON.stringify(sort([1, 2, 3])) === '[1,2,3]');
test('n=3 reversed', JSON.stringify(sort([3, 2, 1])) === '[1,2,3]');
test('n=3 mixed', JSON.stringify(sort([2, 3, 1])) === '[1,2,3]');
test('n=4', JSON.stringify(sort([4, 2, 3, 1])) === '[1,2,3,4]');
test('n=5', JSON.stringify(sort([5, 3, 1, 4, 2])) === '[1,2,3,4,5]');
test('n=6', JSON.stringify(sort([6, 1, 5, 2, 4, 3])) === '[1,2,3,4,5,6]');
test('n=7', JSON.stringify(sort([7, 3, 5, 1, 6, 2, 4])) === '[1,2,3,4,5,6,7]');
test('n=8', JSON.stringify(sort([8, 4, 6, 2, 7, 3, 5, 1])) === '[1,2,3,4,5,6,7,8]');
test('n=8 all same', JSON.stringify(sort([3, 3, 3, 3, 3, 3, 3, 3])) === '[3,3,3,3,3,3,3,3]');
test('n=8 already sorted', JSON.stringify(sort([1, 2, 3, 4, 5, 6, 7, 8])) === '[1,2,3,4,5,6,7,8]');
test('n=8 with negatives', JSON.stringify(sort([-4, 3, -1, 0, 2, -3, 1, 4])) === '[-4,-3,-1,0,1,2,3,4]');

// Exhaustive: test all permutations of [1,2,3,4]
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}
const allPerms = permutations([1, 2, 3, 4]);
let allPermsCorrect = true;
for (const p of allPerms) {
  if (JSON.stringify(sort(p)) !== '[1,2,3,4]') { allPermsCorrect = false; break; }
}
test('all 24 permutations of [1,2,3,4]', allPermsCorrect);

// ════════════════════════════════════════════════════════
// PATH 2: Insertion sort (9 <= n <= 32)
// ════════════════════════════════════════════════════════
group('Insertion Sort (9-32 elements)');

for (const size of [9, 16, 24, 32]) {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 1000) - 500);
  test(`random n=${size}`, verifySorted(arr, sort(arr)));
}
test('n=32 reversed', verifySorted(
  Array.from({ length: 32 }, (_, i) => 32 - i),
  sort(Array.from({ length: 32 }, (_, i) => 32 - i))
));
test('n=32 all same', JSON.stringify(sort(new Array(32).fill(7))) === JSON.stringify(new Array(32).fill(7)));

// ════════════════════════════════════════════════════════
// PATH 3: Pre-sorted / reversed detection
// ════════════════════════════════════════════════════════
group('Sorted/Reversed Detection');

test('1000 sorted', verifySorted(
  Array.from({ length: 1000 }, (_, i) => i),
  sort(Array.from({ length: 1000 }, (_, i) => i))
));
test('1000 reversed', verifySorted(
  Array.from({ length: 1000 }, (_, i) => 1000 - i),
  sort(Array.from({ length: 1000 }, (_, i) => 1000 - i))
));
test('10000 sorted', verifySorted(
  Array.from({ length: 10000 }, (_, i) => i),
  sort(Array.from({ length: 10000 }, (_, i) => i))
));
test('10000 reversed', verifySorted(
  Array.from({ length: 10000 }, (_, i) => 10000 - i),
  sort(Array.from({ length: 10000 }, (_, i) => 10000 - i))
));
// Edge: sorted except last element
const almostSorted = Array.from({ length: 500 }, (_, i) => i);
almostSorted.push(-1);
test('sorted with one outlier at end', verifySorted(almostSorted, sort(almostSorted)));

// All same values (range === 0)
test('10000 all same', (() => {
  const r = sort(new Array(10000).fill(42));
  return r.length === 10000 && r.every(v => v === 42);
})());

// ════════════════════════════════════════════════════════
// PATH 4: Float radix sort
// ════════════════════════════════════════════════════════
group('Float Radix Sort');

test('basic floats', JSON.stringify(sort([3.14, 1.41, 2.72])) === '[1.41,2.72,3.14]');
test('negative floats', verifySorted([-3.5, -1.2, -7.8, -0.1], sort([-3.5, -1.2, -7.8, -0.1])));
test('mixed pos/neg floats', verifySorted(
  [3.14, -2.71, 0.0, -0.5, 1.618, -1.414],
  sort([3.14, -2.71, 0.0, -0.5, 1.618, -1.414])
));

// -0 vs +0
test('-0 vs +0', (() => {
  const r = sort([0, -0, 0, -0]);
  return r.length === 4 && r.every(v => v === 0);
})());

// Infinity
test('Infinity values', (() => {
  const r = sort([Infinity, -Infinity, 0, 1, -1]);
  return r[0] === -Infinity && r[1] === -1 && r[2] === 0 && r[3] === 1 && r[4] === Infinity;
})());

// Very small floats (subnormals)
test('subnormal floats', (() => {
  const r = sort([5e-324, 1e-300, 2.2e-308, 1e-310]);
  for (let i = 1; i < r.length; i++) if (r[i] < r[i - 1]) return false;
  return true;
})());

// Large float arrays
for (const size of [100, 1000, 10000]) {
  const arr = Array.from({ length: size }, () => Math.random() * 2000 - 1000);
  test(`random floats n=${size}`, verifySorted(arr, sort(arr)));
}

// Floats that are close together (precision stress)
test('close floats', (() => {
  const arr = [1.0000000000001, 1.0000000000002, 1.0000000000000, 1.0000000000003];
  const r = sort(arr);
  for (let i = 1; i < r.length; i++) if (r[i] < r[i - 1]) return false;
  return true;
})());

// Mix of large magnitude floats
test('extreme magnitude floats', verifySorted(
  [1e308, -1e308, 1e-308, -1e-308, 0, 1, -1],
  sort([1e308, -1e308, 1e-308, -1e-308, 0, 1, -1])
));

// Float threshold: small float arrays should use merge sort, large should use radix
test('small floats n=50', (() => {
  const arr = Array.from({ length: 50 }, () => Math.random() * 100 - 50);
  return verifySorted(arr, sort(arr));
})());
test('medium floats n=500', (() => {
  const arr = Array.from({ length: 500 }, () => Math.random() * 100 - 50);
  return verifySorted(arr, sort(arr));
})());
test('float threshold boundary n=2000', (() => {
  const arr = Array.from({ length: 2000 }, () => Math.random() * 100 - 50);
  return verifySorted(arr, sort(arr));
})());
test('float above threshold n=2001', (() => {
  const arr = Array.from({ length: 2001 }, () => Math.random() * 100 - 50);
  return verifySorted(arr, sort(arr));
})());

// ════════════════════════════════════════════════════════
// PATH 5: Counting sort (bounded integer range)
// ════════════════════════════════════════════════════════
group('Counting Sort');

for (const size of [100, 1000, 10000, 50000]) {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * size));
  test(`random ints n=${size} range=${size}`, verifySorted(arr, sort(arr)));
}

test('narrow range (0-9)', (() => {
  const arr = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10));
  return verifySorted(arr, sort(arr));
})());

test('negative bounded ints', (() => {
  const arr = Array.from({ length: 5000 }, () => Math.floor(Math.random() * 200) - 100);
  return verifySorted(arr, sort(arr));
})());

// ════════════════════════════════════════════════════════
// PATH 6: Adaptive merge sort (nearly-sorted)
// ════════════════════════════════════════════════════════
group('Adaptive Merge Sort (nearly sorted)');

// Nearly sorted: swap a few pairs
function makeNearlySorted(n, swaps) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let s = 0; s < swaps; s++) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

for (const size of [1000, 5000, 10000]) {
  // Wide-range integers with near-sorted pattern to avoid counting sort
  const arr = makeNearlySorted(size, Math.floor(size * 0.02));
  // Scale values to exceed counting sort range threshold
  const wideArr = arr.map(v => v * 100);
  test(`nearly sorted n=${size}`, verifySorted(wideArr, sort(wideArr)));
}

// ════════════════════════════════════════════════════════
// PATH 7: LSD Radix sort (wide-range integers)
// ════════════════════════════════════════════════════════
group('Radix Sort (wide-range integers)');

for (const size of [1000, 10000, 50000]) {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 2_000_000_000) - 1_000_000_000);
  test(`wide-range ints n=${size}`, verifySorted(arr, sort(arr)));
}

test('max int32 boundaries', verifySorted(
  [2147483647, -2147483648, 0, 1, -1, 2147483646, -2147483647],
  sort([2147483647, -2147483648, 0, 1, -1, 2147483646, -2147483647])
));

// ════════════════════════════════════════════════════════
// INTEGER BOUNDARY: values outside 32-bit range → float path
// ════════════════════════════════════════════════════════
group('Integer Boundary (>32-bit → float path)');

test('large integers route to float', verifySorted(
  [2147483648, -2147483649, 0, 1, 9007199254740991],
  sort([2147483648, -2147483649, 0, 1, 9007199254740991])
));

test('mixed 32-bit and 53-bit ints', verifySorted(
  [100, 2147483648, -100, -2147483649, 0, 9007199254740990, -9007199254740990],
  sort([100, 2147483648, -100, -2147483649, 0, 9007199254740990, -9007199254740990])
));

// ════════════════════════════════════════════════════════
// STABILITY TESTS
// ════════════════════════════════════════════════════════
group('Stability');

// Stability for numericSort: objects with same numeric value should preserve order
test('counting sort stability', (() => {
  // Use indices as a proxy: create duplicates and verify relative order preserved
  const n = 1000;
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 10));
  const indexed = arr.map((v, i) => ({ v, i }));
  const result = sortByKey(indexed, x => x.v);
  for (let i = 1; i < result.length; i++) {
    if (result[i].v === result[i - 1].v && result[i].i < result[i - 1].i) return false;
  }
  return true;
})());

test('sortByKey stability 10K', (() => {
  const arr = Array.from({ length: 10000 }, (_, i) => ({ key: Math.floor(Math.random() * 100), idx: i }));
  const result = sortByKey(arr, x => x.key);
  for (let i = 1; i < result.length; i++) {
    if (result[i].key === result[i - 1].key && result[i].idx < result[i - 1].idx) return false;
  }
  return true;
})());

test('comparator sort stability', (() => {
  const arr = Array.from({ length: 1000 }, (_, i) => ({ key: Math.floor(i / 10), idx: i }));
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  // Build a map of input positions
  const inputPos = new Map();
  arr.forEach((v, i) => inputPos.set(v, i));
  const cmp = (a, b) => a.key - b.key;
  const result = sortWithComparator(arr, cmp);
  for (let i = 1; i < result.length; i++) {
    if (cmp(result[i], result[i - 1]) === 0) {
      if (inputPos.get(result[i]) < inputPos.get(result[i - 1])) return false;
    }
  }
  return true;
})());

// ════════════════════════════════════════════════════════
// IMMUTABILITY
// ════════════════════════════════════════════════════════
group('Immutability (input never mutated)');

test('sort does not mutate', checkImmutable([5, 3, 1, 4, 2]));
test('large array not mutated', checkImmutable(Array.from({ length: 10000 }, () => Math.random())));
test('sortByKey does not mutate', (() => {
  const arr = [{ v: 3 }, { v: 1 }, { v: 2 }];
  const copy = arr.slice();
  sortByKey(arr, x => x.v);
  return arr.length === copy.length && arr.every((v, i) => v === copy[i]);
})());

// ════════════════════════════════════════════════════════
// COMPARATOR SORT
// ════════════════════════════════════════════════════════
group('Comparator Sort');

test('reverse sort', JSON.stringify(sort([1, 5, 3, 2, 4], (a, b) => b - a)) === '[5,4,3,2,1]');
test('sort by abs value', (() => {
  const r = sort([-5, 3, -1, 4, -2], (a, b) => Math.abs(a) - Math.abs(b));
  return JSON.stringify(r) === '[-1,-2,3,4,-5]';
})());
test('large comparator sort', (() => {
  const arr = Array.from({ length: 5000 }, () => Math.random());
  const r = sort(arr, (a, b) => b - a);
  for (let i = 1; i < r.length; i++) if (r[i] > r[i - 1]) return false;
  return true;
})());

// ════════════════════════════════════════════════════════
// STRING SORT
// ════════════════════════════════════════════════════════
group('String Sort');

test('basic strings', JSON.stringify(sort(['banana', 'apple', 'cherry'])) === '["apple","banana","cherry"]');
test('case-sensitive', JSON.stringify(sort(['b', 'A', 'a', 'B'])) === '["A","B","a","b"]');
test('empty strings', JSON.stringify(sort(['b', '', 'a'])) === '["","a","b"]');

// ════════════════════════════════════════════════════════
// CLEAN SORT (NaN, null, undefined, mixed)
// ════════════════════════════════════════════════════════
group('Clean Sort');

test('NaN goes after numbers', (() => {
  const r = cleanSort([3, NaN, 1, NaN, 2]);
  return r[0] === 1 && r[1] === 2 && r[2] === 3 && isNaN(r[3]) && isNaN(r[4]);
})());

test('undefined goes last', (() => {
  const r = cleanSort([3, undefined, 1]);
  return r[0] === 1 && r[1] === 3 && r[2] === undefined;
})());

test('null between numbers and strings', (() => {
  const r = cleanSort([3, null, 1, null]);
  return r[0] === 1 && r[1] === 3 && r[2] === null && r[3] === null;
})());

test('full mixed sort', (() => {
  const r = cleanSort([5, null, NaN, 'b', 2, undefined, 'a', null, NaN]);
  // numbers, nulls, strings, NaN, undefined
  return r[0] === 2 && r[1] === 5 && r[2] === null && r[3] === null
    && r[4] === 'a' && r[5] === 'b' && isNaN(r[6]) && isNaN(r[7]) && r[8] === undefined;
})());

test('sort with clean option', (() => {
  const r = sort([5, null, NaN, 2, undefined], { clean: true });
  return r[0] === 2 && r[1] === 5 && r[2] === null && isNaN(r[3]) && r[4] === undefined;
})());

// ════════════════════════════════════════════════════════
// OBJECT SORTING (sortByKey)
// ════════════════════════════════════════════════════════
group('Object Sorting (sortByKey)');

test('basic object sort', (() => {
  const arr = [{ n: 'C', v: 3 }, { n: 'A', v: 1 }, { n: 'B', v: 2 }];
  const r = sortByKey(arr, x => x.v);
  return r[0].n === 'A' && r[1].n === 'B' && r[2].n === 'C';
})());

test('10K objects', (() => {
  const arr = Array.from({ length: 10000 }, () => ({ id: Math.floor(Math.random() * 10000) }));
  const r = sortByKey(arr, x => x.id);
  for (let i = 1; i < r.length; i++) if (r[i].id < r[i - 1].id) return false;
  return true;
})());

test('objects with negative keys', (() => {
  const arr = Array.from({ length: 5000 }, () => ({ v: Math.floor(Math.random() * 2000) - 1000 }));
  const r = sortByKey(arr, x => x.v);
  for (let i = 1; i < r.length; i++) if (r[i].v < r[i - 1].v) return false;
  return true;
})());

test('objects with float keys (fallback path)', (() => {
  const arr = Array.from({ length: 1000 }, () => ({ v: Math.random() * 100 }));
  const r = sortByKey(arr, x => x.v);
  for (let i = 1; i < r.length; i++) if (r[i].v < r[i - 1].v) return false;
  return true;
})());

test('objects with wide-range keys (fallback path)', (() => {
  const arr = Array.from({ length: 1000 }, () => ({ v: Math.floor(Math.random() * 2e9) - 1e9 }));
  const r = sortByKey(arr, x => x.v);
  for (let i = 1; i < r.length; i++) if (r[i].v < r[i - 1].v) return false;
  return true;
})());

// ════════════════════════════════════════════════════════
// SORT OPTIONS API
// ════════════════════════════════════════════════════════
group('API: sort() options');

test('sort with key option', (() => {
  const arr = [{ p: 30 }, { p: 10 }, { p: 20 }];
  const r = sort(arr, { key: x => x.p });
  return r[0].p === 10 && r[1].p === 20 && r[2].p === 30;
})());

test('sort null input', JSON.stringify(sort(null)) === '[]');
test('sort undefined input', JSON.stringify(sort(undefined)) === '[]');

// ════════════════════════════════════════════════════════
// STRESS: large random arrays verified against native sort
// ════════════════════════════════════════════════════════
group('Stress Tests (large random, verified against native)');

for (const size of [100000]) {
  // Random integers
  const ints = Array.from({ length: size }, () => Math.floor(Math.random() * size * 10) - size * 5);
  test(`100K random ints`, verifySorted(ints, sort(ints)));

  // Random floats
  const floats = Array.from({ length: size }, () => Math.random() * 10000 - 5000);
  test(`100K random floats`, verifySorted(floats, sort(floats)));

  // Wide-range integers
  const wide = Array.from({ length: size }, () => Math.floor(Math.random() * 2_000_000_000) - 1_000_000_000);
  test(`100K wide-range ints`, verifySorted(wide, sort(wide)));
}

// ════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════
group('Edge Cases');

test('two elements reversed', JSON.stringify(sort([2, 1])) === '[1,2]');
test('all negative', verifySorted([-5, -3, -8, -1, -4], sort([-5, -3, -8, -1, -4])));
test('single repeated value 50K', (() => {
  const r = sort(new Array(50000).fill(99));
  return r.length === 50000 && r[0] === 99 && r[49999] === 99;
})());
test('alternating high-low', (() => {
  const arr = Array.from({ length: 1000 }, (_, i) => i % 2 === 0 ? 1000000 : 0);
  return verifySorted(arr, sort(arr));
})());
test('pipe organ pattern', (() => {
  const arr = Array.from({ length: 1000 }, (_, i) => i < 500 ? i : 999 - i);
  return verifySorted(arr, sort(arr));
})());
test('sawtooth pattern', (() => {
  const arr = Array.from({ length: 1000 }, (_, i) => i % 100);
  return verifySorted(arr, sort(arr));
})());

// ════════════════════════════════════════════════════════
// PATH BOUNDARY TRIGGERS
// ════════════════════════════════════════════════════════
group('Path Boundary Triggers');

// Sorting network (n=8) vs insertion sort (n=9)
test('n=8 boundary', verifySorted([8,3,6,1,7,4,2,5], sort([8,3,6,1,7,4,2,5])));
test('n=9 boundary', verifySorted([9,3,6,1,7,4,2,5,8], sort([9,3,6,1,7,4,2,5,8])));

// Insertion sort (n=32) vs adaptive scan (n=33)
test('n=32 boundary', (() => {
  const arr = Array.from({ length: 32 }, (_, i) => 32 - i);
  return verifySorted(arr, sort(arr));
})());
test('n=33 boundary', (() => {
  const arr = Array.from({ length: 33 }, (_, i) => 33 - i);
  return verifySorted(arr, sort(arr));
})());

// Counting sort boundary: range = n*10 exactly
test('counting sort boundary (range = n*10)', (() => {
  const n = 1000;
  const arr = Array.from({ length: n }, (_, i) => i * 10); // range = 9990 = ~n*10
  // shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifySorted(arr, sort(arr));
})());

// Just past counting sort: range = n*10 + 1
test('past counting sort boundary (range > n*10)', (() => {
  const n = 1000;
  const arr = Array.from({ length: n }, (_, i) => i * 11); // range = 10989 > n*10
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifySorted(arr, sort(arr));
})());

// Float threshold: n=1999 (merge sort) vs n=2001 (radix sort)
test('float n=1999 (merge path)', (() => {
  const arr = Array.from({ length: 1999 }, () => Math.random() * 1000 - 500);
  return verifySorted(arr, sort(arr));
})());
test('float n=2001 (radix path)', (() => {
  const arr = Array.from({ length: 2001 }, () => Math.random() * 1000 - 500);
  return verifySorted(arr, sort(arr));
})());

// Nearly-sorted detection boundary (~90% ordered)
test('~90% ordered (should still sort correctly)', (() => {
  const n = 5000;
  const arr = Array.from({ length: n }, (_, i) => i * 100); // wide range, avoids counting sort
  // swap ~10% of pairs to land near 90% threshold
  for (let i = 0; i < n * 0.05; i++) {
    const a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
    const t = arr[a]; arr[a] = arr[b]; arr[b] = t;
  }
  return verifySorted(arr, sort(arr));
})());

test('~80% ordered (should still sort correctly)', (() => {
  const n = 5000;
  const arr = Array.from({ length: n }, (_, i) => i * 100);
  for (let i = 0; i < n * 0.10; i++) {
    const a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
    const t = arr[a]; arr[a] = arr[b]; arr[b] = t;
  }
  return verifySorted(arr, sort(arr));
})());

// ════════════════════════════════════════════════════════
// NUMERIC EDGE CASES
// ════════════════════════════════════════════════════════
group('Numeric Edge Cases');

test('NaN in numericSort does not crash', (() => {
  try {
    const r = numericSort([3, NaN, 1, NaN, 2]);
    return r.length === 5; // just verify no crash; order with NaN is undefined
  } catch(e) { return false; }
})());

test('NaN + Infinity mixed', (() => {
  try {
    const r = numericSort([Infinity, NaN, -Infinity, 0, NaN, 1]);
    return r.length === 6;
  } catch(e) { return false; }
})());

test('MAX_SAFE_INTEGER and MIN_SAFE_INTEGER', verifySorted(
  [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0, 1, -1],
  sort([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0, 1, -1])
));

test('MAX_VALUE and MIN_VALUE', (() => {
  const r = sort([Number.MAX_VALUE, Number.MIN_VALUE, 0, -Number.MAX_VALUE, 1]);
  return r[0] === -Number.MAX_VALUE && r[r.length - 1] === Number.MAX_VALUE;
})());

test('exact 32-bit boundary integers', verifySorted(
  [2147483647, 2147483648, -2147483648, -2147483649, 0],
  sort([2147483647, 2147483648, -2147483648, -2147483649, 0])
));

test('all negative floats (10K)', (() => {
  const arr = Array.from({ length: 10000 }, () => -Math.random() * 1e6);
  return verifySorted(arr, sort(arr));
})());

test('floats differing by EPSILON', (() => {
  const base = 1.0;
  const arr = [base + 3 * Number.EPSILON, base, base + Number.EPSILON, base + 2 * Number.EPSILON];
  const r = sort(arr);
  for (let i = 1; i < r.length; i++) if (r[i] < r[i - 1]) return false;
  return true;
})());

test('-0 in large array', (() => {
  const arr = Array.from({ length: 100 }, (_, i) => i % 3 === 0 ? -0 : i % 3 === 1 ? 0 : i);
  const r = sort(arr);
  return verifySorted(arr, r);
})());

// ════════════════════════════════════════════════════════
// API MISUSE / DEFENSIVE BEHAVIOR
// ════════════════════════════════════════════════════════
group('API Defensive Behavior');

test('sort(arr, null) works', verifySorted([3, 1, 2], sort([3, 1, 2], null)));
test('sort(arr, undefined) works', verifySorted([3, 1, 2], sort([3, 1, 2], undefined)));
test('sort(arr, {}) auto-detects', verifySorted([3, 1, 2], sort([3, 1, 2], {})));
test('sort(arr, {clean:false}) auto-detects', verifySorted([3, 1, 2], sort([3, 1, 2], { clean: false })));

test('key takes precedence over clean', (() => {
  const arr = [{ v: 3 }, { v: 1 }, { v: 2 }];
  const r = sort(arr, { key: x => x.v, clean: true });
  return r[0].v === 1 && r[1].v === 2 && r[2].v === 3;
})());

test('sortByKey with NaN keys does not crash', (() => {
  try {
    const arr = [{ v: 3 }, { v: NaN }, { v: 1 }];
    const r = sortByKey(arr, x => x.v);
    return r.length === 3;
  } catch(e) { return false; }
})());

test('sortByKey with Infinity keys', (() => {
  const arr = [{ v: Infinity }, { v: 1 }, { v: -Infinity }, { v: 0 }];
  const r = sortByKey(arr, x => x.v);
  return r[0].v === -Infinity && r[r.length - 1].v === Infinity;
})());

test('double sort is idempotent', (() => {
  const arr = [5, 3, 8, 1, 9, 2, 7];
  const once = sort(arr);
  const twice = sort(once);
  return JSON.stringify(once) === JSON.stringify(twice);
})());

test('sort already-sorted output', (() => {
  const arr = Array.from({ length: 10000 }, () => Math.floor(Math.random() * 10000));
  const r1 = sort(arr);
  const r2 = sort(r1);
  return JSON.stringify(r1) === JSON.stringify(r2);
})());

// ════════════════════════════════════════════════════════
// STABILITY PROOF: Every path with tagged objects
// ════════════════════════════════════════════════════════
group('Stability: All Paths');

// Helper: verify stability using tagged objects through sortByKey
function verifyStability(arr, keyFn) {
  const result = sortByKey(arr, keyFn);
  const inputPos = new Map();
  arr.forEach((v, i) => inputPos.set(v, i));
  for (let i = 1; i < result.length; i++) {
    if (keyFn(result[i]) === keyFn(result[i - 1])) {
      if (inputPos.get(result[i]) < inputPos.get(result[i - 1])) return false;
    }
  }
  return true;
}

test('stability: sorting network (n=8, equal keys)', (() => {
  const arr = [{ k: 1, id: 0 }, { k: 1, id: 1 }, { k: 0, id: 2 }, { k: 0, id: 3 },
               { k: 1, id: 4 }, { k: 0, id: 5 }, { k: 1, id: 6 }, { k: 0, id: 7 }];
  return verifyStability(arr, x => x.k);
})());

test('stability: insertion sort (n=20, equal keys)', (() => {
  const arr = Array.from({ length: 20 }, (_, i) => ({ k: i % 3, id: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifyStability(arr, x => x.k);
})());

test('stability: counting sort (n=5000, 10 distinct keys)', (() => {
  const arr = Array.from({ length: 5000 }, (_, i) => ({ k: i % 10, id: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifyStability(arr, x => x.k);
})());

test('stability: radix sort (n=5000, wide range with dups)', (() => {
  // Keys span wide range but have duplicates — forces radix sort path in sortByKey fallback
  const arr = Array.from({ length: 5000 }, (_, i) => ({ k: (i % 500) * 100000, id: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifyStability(arr, x => x.k);
})());

test('stability: comparator with 1000+ equal keys', (() => {
  const arr = Array.from({ length: 2000 }, (_, i) => ({ k: i % 5, id: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  const inputPos = new Map();
  arr.forEach((v, i) => inputPos.set(v, i));
  const cmp = (a, b) => a.k - b.k;
  const result = sortWithComparator(arr, cmp);
  for (let i = 1; i < result.length; i++) {
    if (cmp(result[i], result[i - 1]) === 0) {
      if (inputPos.get(result[i]) < inputPos.get(result[i - 1])) return false;
    }
  }
  return true;
})());

test('stability: comparator returns 0 for different values', (() => {
  const arr = Array.from({ length: 100 }, (_, i) => ({ v: i }));
  const inputOrder = arr.slice();
  // comparator that treats all as equal
  const result = sortWithComparator(arr, () => 0);
  // stable sort with all-equal comparator should preserve input order
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== inputOrder[i]) return false;
  }
  return true;
})());

// ════════════════════════════════════════════════════════
// ARRAY PATTERNS
// ════════════════════════════════════════════════════════
group('Array Patterns');

test('plateau pattern', (() => {
  const arr = [];
  for (let v = 0; v < 100; v++) for (let i = 0; i < 50; i++) arr.push(v);
  // shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifySorted(arr, sort(arr));
})());

test('two distinct values', (() => {
  const arr = Array.from({ length: 10000 }, (_, i) => i % 2);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return verifySorted(arr, sort(arr));
})());

test('V-shape', (() => {
  const arr = Array.from({ length: 1001 }, (_, i) => i <= 500 ? 500 - i : i - 500);
  return verifySorted(arr, sort(arr));
})());

test('sorted except first element', (() => {
  const arr = [99999, ...Array.from({ length: 999 }, (_, i) => i)];
  return verifySorted(arr, sort(arr));
})());

test('sorted except middle element', (() => {
  const arr = Array.from({ length: 1000 }, (_, i) => i);
  arr[500] = -1;
  return verifySorted(arr, sort(arr));
})());

test('nearly reverse-sorted', (() => {
  const arr = Array.from({ length: 5000 }, (_, i) => (5000 - i) * 100);
  // swap a few to make it ~95% reversed
  for (let i = 0; i < 50; i++) {
    const a = Math.floor(Math.random() * 5000), b = Math.floor(Math.random() * 5000);
    const t = arr[a]; arr[a] = arr[b]; arr[b] = t;
  }
  return verifySorted(arr, sort(arr));
})());

test('all duplicates except one', (() => {
  const arr = new Array(10000).fill(42);
  arr[5000] = 0;
  return verifySorted(arr, sort(arr));
})());

test('single element repeated 100K', (() => {
  const r = sort(new Array(100000).fill(7));
  return r.length === 100000 && r[0] === 7 && r[99999] === 7;
})());

// ════════════════════════════════════════════════════════
// STRESS / SCALE
// ════════════════════════════════════════════════════════
group('Stress Tests (500K)');

test('500K random integers', (() => {
  const arr = Array.from({ length: 500000 }, () => Math.floor(Math.random() * 1000000) - 500000);
  return verifySorted(arr, sort(arr));
})());

test('500K random floats', (() => {
  const arr = Array.from({ length: 500000 }, () => Math.random() * 1e6 - 5e5);
  return verifySorted(arr, sort(arr));
})());

test('500K already sorted', (() => {
  const arr = Array.from({ length: 500000 }, (_, i) => i);
  const r = sort(arr);
  return r.length === 500000 && r[0] === 0 && r[499999] === 499999;
})());

// ════════════════════════════════════════════════════════
// SORTBYKEY EDGE CASES
// ════════════════════════════════════════════════════════
group('sortByKey Edge Cases');

test('keyFn returns undefined (missing property)', (() => {
  try {
    const arr = [{ v: 3 }, { x: 1 }, { v: 2 }]; // middle object missing 'v'
    const r = sortByKey(arr, x => x.v);
    return r.length === 3;
  } catch(e) { return false; }
})());

test('keyFn returns mix of ints and floats', (() => {
  const arr = [{ v: 3 }, { v: 1.5 }, { v: 2 }, { v: 0.1 }];
  const r = sortByKey(arr, x => x.v);
  return r[0].v === 0.1 && r[1].v === 1.5 && r[2].v === 2 && r[3].v === 3;
})());

test('objects with 0 as key (falsy)', (() => {
  const arr = [{ v: 3 }, { v: 0 }, { v: 1 }];
  const r = sortByKey(arr, x => x.v);
  return r[0].v === 0 && r[1].v === 1 && r[2].v === 3;
})());

test('empty array to sortByKey', (() => {
  const r = sortByKey([], x => x.v);
  return r.length === 0;
})());

test('single element to sortByKey', (() => {
  const r = sortByKey([{ v: 42 }], x => x.v);
  return r.length === 1 && r[0].v === 42;
})());

test('sortByKey does not call keyFn more than once per element', (() => {
  let calls = 0;
  const arr = Array.from({ length: 100 }, (_, i) => ({ v: i }));
  sortByKey(arr, x => { calls++; return x.v; });
  return calls === 100;
})());

// ════════════════════════════════════════════════════════
// RESULTS
// ════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) { console.log('FAILED'); process.exit(1); }
console.log('ALL PASSED');
