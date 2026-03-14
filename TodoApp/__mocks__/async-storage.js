let store = {};

module.exports = {
  setItem: jest.fn((key, value) => {
    return Promise.resolve(store[key] = value);
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(key in store ? store[key] : null);
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    store = {};
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(store));
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve(keys.map((key) => [key, key in store ? store[key] : null]));
  }),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => {
      store[key] = value;
    });
    return Promise.resolve();
  }),
};
