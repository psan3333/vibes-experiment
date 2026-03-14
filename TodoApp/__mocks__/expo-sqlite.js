const mockExecSync = jest.fn();
const mockRunSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockGetFirstSync = jest.fn();

module.exports = {
  openDatabaseSync: jest.fn(() => ({
    execSync: mockExecSync,
    runSync: mockRunSync,
    getAllSync: mockGetAllSync,
    getFirstSync: mockGetFirstSync,
  })),
};
