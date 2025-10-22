import { pathToRegexp } from 'path-to-regexp';

function main() {
  const [pathExpr, pathToTest, ...args] = process.argv.slice(2);

  if (!pathExpr || !pathToTest) {
    console.error(
      'Usage: pnpm -F internal-scripts test-routing <pathExpr> <pathToTest>',
    );
    process.exit(1);
  }
  console.log(`Testing "${pathToTest}" against "${pathExpr}"`);
  const regexp = pathToRegexp(pathExpr);
  console.log(`Compiled regexp: ${regexp}`);
  console.log(`Matches: ${regexp.exec(pathToTest)}`);
}

main();
