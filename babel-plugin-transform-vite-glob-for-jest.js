import fs from 'node:fs';
import path from 'node:path';

const escapeRegExp = (value) => value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');

const globToRegExp = (pattern) => {
  const expression = pattern
    .split('*')
    .map(escapeRegExp)
    .join('.*');

  return new RegExp(`^${expression}$`);
};

const toImportPath = (sourceDir, filePath) => {
  const relativePath = path.relative(sourceDir, filePath).split(path.sep).join('/');

  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
};

const getBooleanOption = (optionsNode, name) => {
  if (!optionsNode) return false;

  const option = optionsNode.properties.find((property) => {
    return property.key?.name === name || property.key?.value === name;
  });

  return option?.value?.value === true;
};

export default function transformViteGlobForJest({ types: t }) {
  return {
    name: 'transform-vite-glob-for-jest',
    visitor: {
      CallExpression(babelPath, state) {
        const { callee } = babelPath.node;

        const isImportMetaGlob = (
          t.isMemberExpression(callee) &&
          t.isMetaProperty(callee.object) &&
          callee.object.meta.name === 'import' &&
          callee.object.property.name === 'meta' &&
          t.isIdentifier(callee.property, { name: 'glob' })
        );

        if (!isImportMetaGlob) return;

        const [patternNode, optionsNode] = babelPath.node.arguments;

        if (!t.isStringLiteral(patternNode)) {
          throw babelPath.buildCodeFrameError('import.meta.glob() must use a string literal in Jest.');
        }

        if (optionsNode && !t.isObjectExpression(optionsNode)) {
          throw babelPath.buildCodeFrameError('import.meta.glob() options must be an object literal in Jest.');
        }

        const sourceFile = state.filename;
        const sourceDir = path.dirname(sourceFile);
        const absolutePattern = path.resolve(sourceDir, patternNode.value);
        const globDir = path.dirname(absolutePattern);
        const filenamePattern = path.basename(absolutePattern);
        const filenameRegExp = globToRegExp(filenamePattern);
        const isEager = getBooleanOption(optionsNode, 'eager');

        const globEntries = fs.readdirSync(globDir)
          .filter((filename) => filenameRegExp.test(filename))
          .sort()
          .map((filename) => {
            const importPath = toImportPath(sourceDir, path.join(globDir, filename));
            const moduleExpression = t.objectExpression([
              t.objectProperty(
                t.identifier('default'),
                t.callExpression(t.identifier('require'), [t.stringLiteral(importPath)])
              ),
            ]);

            return t.objectProperty(
              t.stringLiteral(importPath),
              isEager
                ? moduleExpression
                : t.arrowFunctionExpression([], t.callExpression(
                  t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                  [moduleExpression]
                ))
            );
          });

        babelPath.replaceWith(t.objectExpression(globEntries));
      },
    },
  };
}
