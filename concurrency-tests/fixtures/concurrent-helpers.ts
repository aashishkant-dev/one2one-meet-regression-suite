import { Page } from '@playwright/test';

export interface ConcurrentRequest {
  name: string;
  action: () => Promise<any>;
}

export interface ConcurrentResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}

/**
 * Fire multiple async actions concurrently and collect results
 */
export async function fireParallel(
  requests: ConcurrentRequest[],
  delayMs: number = 0
): Promise<ConcurrentResult[]> {
  const startTime = Date.now();

  if (delayMs > 0) {
    // Introduce small delays between fires to approximate simultaneous clicks
    const promises = requests.map((req, idx) =>
      new Promise<ConcurrentResult>(async (resolve) => {
        try {
          await new Promise(r => setTimeout(r, idx * delayMs));
          const result = await Promise.race([
            req.action(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 30000)
            ),
          ]);
          resolve({
            name: req.name,
            success: true,
            result,
            timestamp: Date.now() - startTime,
          });
        } catch (error) {
          resolve({
            name: req.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now() - startTime,
          });
        }
      })
    );
    return Promise.all(promises);
  } else {
    // True parallel execution
    const promises = requests.map((req) =>
      new Promise<ConcurrentResult>(async (resolve) => {
        try {
          const result = await Promise.race([
            req.action(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 30000)
            ),
          ]);
          resolve({
            name: req.name,
            success: true,
            result,
            timestamp: Date.now() - startTime,
          });
        } catch (error) {
          resolve({
            name: req.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now() - startTime,
          });
        }
      })
    );
    return Promise.all(promises);
  }
}

/**
 * Count successful outcomes from parallel execution
 */
export function countSuccessful(results: ConcurrentResult[]): number {
  return results.filter(r => r.success).length;
}

/**
 * Get first successful result
 */
export function getFirstSuccess(results: ConcurrentResult[]): ConcurrentResult | undefined {
  return results.find(r => r.success);
}

/**
 * Get first failed result
 */
export function getFirstFailure(results: ConcurrentResult[]): ConcurrentResult | undefined {
  return results.find(r => !r.success);
}

/**
 * Click button on multiple pages simultaneously
 */
export async function clickParallel(pages: Page[], selector: string): Promise<ConcurrentResult[]> {
  return fireParallel(
    pages.map((page, idx) => ({
      name: `Page ${idx + 1}`,
      action: async () => {
        const button = page.locator(selector).first();
        await button.click();
        return { clicked: true };
      },
    })),
    0 // True parallel
  );
}

/**
 * Verify state across multiple pages
 */
export async function verifyStateParallel(
  pages: Page[],
  selector: string
): Promise<Map<string, string>> {
  const states = new Map<string, string>();
  const promises = pages.map(async (page, idx) => {
    const element = page.locator(selector).first();
    const text = await element.textContent();
    states.set(`Page ${idx + 1}`, text || '');
  });
  await Promise.all(promises);
  return states;
}
