export type AbortBehavior = 'throws' | 'returns';

export class NestedAbortController extends AbortController {
  private readonly cleanup = new AbortController();

  constructor(parent?: AbortSignal) {
    super();
    parent?.addEventListener('abort', () => this.abort(), {
      signal: this.cleanup.signal,
    });
  }

  abort(reason?: any) {
    this.cleanup.abort();
    super.abort(reason);
  }
}

export function anyAbortSignal(...signals: readonly AbortSignal[]) {
  const controller = new AbortController();
  const abortedSignal = signals.find((signal) => signal.aborted);

  if (abortedSignal) {
    controller.abort(abortedSignal.reason);
  } else {
    for (const signal of signals) {
      signal.addEventListener('abort', () => controller.abort(signal.reason), {
        signal: controller.signal,
      });
    }
  }

  return controller.signal;
}

export async function raceAgainstAbortSignal<T>(
  race: () => Promise<T>,
  {
    signal,
    ifAborted,
  }: {signal: AbortSignal; ifAborted?(): void | Promise<void>},
): Promise<T> {
  const raceAbort = new AbortController();

  const result = await Promise.race([racer(), abortRacer()]);

  return result as T;

  async function racer() {
    try {
      const result = await race();
      return result;
    } finally {
      raceAbort.abort();
    }
  }

  async function abortRacer() {
    await new Promise<void>((resolve, reject) => {
      signal.addEventListener(
        'abort',
        async () => {
          try {
            if (ifAborted) await ifAborted();
            reject(new AbortError());
          } catch (error) {
            reject(error);
          }
        },
        {signal: raceAbort.signal},
      );

      raceAbort.signal.addEventListener(
        'abort',
        () => {
          resolve();
        },
        {signal},
      );
    });
  }
}

// @see https://github.com/nodejs/node/blob/master/lib/internal/errors.js#L822-L834
export class AbortError extends Error {
  static test(error: unknown): error is AbortError {
    return error != null && (error as any).code === 'ABORT_ERR';
  }

  readonly code = 'ABORT_ERR';
  readonly name = 'AbortError';

  constructor(message = 'The operation was aborted') {
    super(message);
  }
}
