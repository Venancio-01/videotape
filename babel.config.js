module.exports = function (api) {
  api.cache(true);
  let plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '~': './',
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/types': './src/types',
          '@/utils': './src/utils',
          '@/stores': './src/stores',
          '@/storage': './src/storage',
          '@/database': './src/database',
          '@/navigation': './src/navigation',
          '@/features': './src/features',
          '@/core': './app/core',
          '@/hooks': './app/hooks',
          '@/constants': './app/constants',
          '@/theme': './app/theme',
          '@/lib': './lib',
        },
      },
    ],
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
