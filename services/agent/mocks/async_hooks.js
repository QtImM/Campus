// Stub for node:async_hooks to support LangChain in React Native
export class AsyncLocalStorage {
    disable() { }
    getStore() { return undefined; }
    run(store, callback, ...args) {
        return callback(...args);
    }
    enterWith(store) { }
}
