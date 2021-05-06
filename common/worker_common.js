globalThis.nextID = 1;

const canSerializeError = (() => {
  try {
    postMessage({
      id: nextID++,
      type: "ignore",
      err: new Error(),
    });
    return true;
  } catch {
    return false;
  }
})();

function serializeError(err) {
  if (!(err instanceof Error) || canSerializeError) {
    return err;
  } else {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
}
