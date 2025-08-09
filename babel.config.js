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
          '@/components': './app/components',
          '@/screens': './app/screens',
          '@/services': './app/services',
          '@/types': './app/types',
          '@/utils': './app/utils',
          '@/stores': './app/stores',
          '@/storage': './app/storage',
          '@/database': './app/database',
          '@/navigation': './app/navigation',
          '@/features': './app/features',
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
