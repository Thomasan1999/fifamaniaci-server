export {};

declare global {
    type Merge<M, N> = Omit<M, Extract<keyof M, keyof N>> & N;
    type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
}
