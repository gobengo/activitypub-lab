export class ArrayRepository<T> {
  private inboxArray: Array<T> = [];
  // constructor() {}
  async push(activity: T): Promise<void> {
    this.inboxArray.push(activity);
  }
  async count(): Promise<number> {
    return this.inboxArray.length;
  }
}
