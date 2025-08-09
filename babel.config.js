module.exports = function (api) {
  api.cache(true);
  let plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './app',
          '@/components': './app/components',
          '@/screens': './app/screens',
          '@/services': './app/services',
          '@/types': './app/types',
          '@/utils': './app/utils',
          '@/stores': './app/stores',
          '@/storage': './app/storage',
          '@/database': './app/database',
          '@/navigation': './app/navigation',
          '@/lib': './lib',
          '@/theme': './theme',
        },
      },
    ],
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
