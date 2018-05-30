import * as hs from './homespring.js';

const runner = new hs.Runner();
const root = hs.tokensToTree(runner, hs.tokens, hs.parser(process.argv[process.argv.length - 1]));
runner.setRoot(root);

runner.run();
