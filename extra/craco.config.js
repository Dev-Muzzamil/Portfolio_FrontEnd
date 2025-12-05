module.exports = {
  eslint: {
    enable: false,
  },
  webpack: {
    configure: (webpackConfig) => {
      // Remove ESLint plugin completely
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
      );
      return webpackConfig;
    },
  },
};
