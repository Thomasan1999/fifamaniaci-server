Object.defineProperty(Array.prototype, `lastItem`, {
    configurable: false,
    enumerable: false,
    get()
    {
        return this[this.lastIndex];
    },
    set(value)
    {
        return this[this.lastIndex] = value;
    }
});
Object.defineProperty(Array.prototype, `lastIndex`, {
    configurable: false,
    enumerable: false,
    get()
    {
        return Math.max(0, this.length - 1);
    }
});
