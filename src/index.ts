export interface FastMutexConfig {
  id: string;
  name: string;
  retryLimit: number;
}

export type AsyncFn = <T = any>() => void | Promise<T>;

const raf = () => new Promise(resolve => requestAnimationFrame(resolve));

export class Fmx {
  private id = `${new Date().getTime()}:${(Math.random() * 1000000000) | 0}`;
  private name = 'fmx';
  private retryLimit = 100;

  public constructor(config: Partial<FastMutexConfig> = {}) {
    this.id = config.id || this.id;
    this.name = config.name || this.name;
    this.retryLimit = config.retryLimit || this.retryLimit;
  }

  public lock = (asyncFn: AsyncFn) => this.tryLock(0, asyncFn);

  private getLock<T = any>(key: string): T | null {
    const value = localStorage.getItem(key);
    if (typeof value !== 'string') {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  private setLock<T = any>(key: string, value: T): void {
    try {
      const stringified = JSON.stringify(value);
      localStorage.setItem(key, stringified);
    } catch (error) {
      console.error(error);
    }
  }

  private isFree = (name: string) => {
    const val = this.getLock(name);
    return Number(val) === 0 || val === undefined || val === null;
  };

  private retry = async (retries: number, asyncFn: AsyncFn) => {
    await raf();
    await this.tryLock(retries + 1, asyncFn);
  };

  private async tryLock(retries: number, asyncFn: AsyncFn) {
    const A = `${this.name}_lock_A`;
    const B = `${this.name}_lock_B`;

    this.setLock(A, this.id);

    if (!this.isFree(B) && retries <= this.retryLimit) {
      return this.retry(retries, asyncFn);
    }

    this.setLock(B, this.id);

    if (this.getLock(A) === this.id) {
      await asyncFn();
      return this.setLock(B, 0);
    }

    await raf();

    if (this.getLock(B) !== this.id) {
      return this.retry(retries, asyncFn);
    }

    await asyncFn();
    return this.setLock(B, 0);
  }
}
