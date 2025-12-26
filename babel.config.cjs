module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-modules-commonjs', { loose: true }],
    function({ types: t }) {
      return {
        visitor: {
          MemberExpression(path) {
            // Transform import.meta.env to globalThis.import.meta.env for Jest
            // This handles both import.meta.env and import.meta.env?.PROP
            if (
              path.node.object &&
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property &&
              path.node.object.property.name === 'meta' &&
              t.isIdentifier(path.node.property) &&
              path.node.property.name === 'env'
            ) {
              // Replace import.meta.env with globalThis.import.meta.env
              path.replaceWith(
                t.memberExpression(
                  t.memberExpression(
                    t.memberExpression(
                      t.identifier('globalThis'),
                      t.identifier('import')
                    ),
                    t.identifier('meta')
                  ),
                  t.identifier('env')
                )
              );
            }
          },
        },
      };
    },
  ],
};

