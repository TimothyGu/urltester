export let process = {
  cwd: () => '/',
  env: {},
  nextTick: (callback, ...args) => {
    queueMicrotask(() => callback(...args));
  },
  pid: 0,
};
