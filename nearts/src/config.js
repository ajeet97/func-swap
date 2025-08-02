const path = require('path');
const homedir = require('os').homedir();

module.exports = {
  sandbox: {
    networkId: 'sandbox',
    nodeUrl: 'http://localhost:3030',
    masterAccount: 'sandbox.test.near',
    keyPath: path.join(homedir, '.near-credentials', 'sandbox', 'sandbox.test.near.json')
  }
};
// near add-credentials sandbox.test.near --seedPhrase "shock party frozen venue hen earn yard board bargain art broccoli above"