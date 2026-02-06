
import { performance } from 'perf_hooks';

// Mock Book interface for the benchmark
interface Book {
  completionOrder: number;
}

function runBenchmark() {
  const sizes = [1000, 10000, 100000, 200000]; // 200k usually triggers stack overflow in some environments

  console.log('Running benchmark for Max Order Calculation...');
  console.log('---------------------------------------------');

  for (const size of sizes) {
    console.log(`\nTesting with ${size} books:`);
    const books: Book[] = Array.from({ length: size }, (_, i) => ({
      completionOrder: i,
    }));

    // Method 1: Current Implementation (Spread)
    try {
      const start = performance.now();
      const maxOrder = books.length > 0
        ? Math.max(...books.map(b => b.completionOrder || 0))
        : 0;
      const end = performance.now();
      console.log(`[Spread] Result: ${maxOrder}, Time: ${(end - start).toFixed(4)}ms`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log(`[Spread] Failed: ${error.message}`);
        } else {
            console.log(`[Spread] Failed: Unknown error`);
        }
    }

    // Method 2: Optimized Implementation (Reduce)
    try {
      const start = performance.now();
      const maxOrder = books.reduce((max, b) => Math.max(max, b.completionOrder || 0), 0);
      const end = performance.now();
      console.log(`[Reduce] Result: ${maxOrder}, Time: ${(end - start).toFixed(4)}ms`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log(`[Reduce] Failed: ${error.message}`);
        } else {
            console.log(`[Reduce] Failed: Unknown error`);
        }
    }
  }
}

runBenchmark();
