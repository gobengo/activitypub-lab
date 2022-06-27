export class ArrayRepository<T> {
  private items: Array<T> = [];
  // constructor() {}
  async push(activity: T): Promise<void> {
    this.items.push(activity);
  }
  async count(): Promise<number> {
    return this.items.length;
  }
  async read(): Promise<{ items: T[] }> {
    const items = this.items;
    return { items };
  }
}
