module.exports = function (api) {
  api.cache(true);
  let plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src'
        },
      },
    ],
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
