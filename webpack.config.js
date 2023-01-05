const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    classificacao: './devAssets/js/classificacao.js',
    configuracoes: './devAssets/js/configuracoes.js',
    customSelect: './devAssets/js/customSelect.js',
    equipas: './devAssets/js/equipas.js',
    escaloes: './devAssets/js/escaloes.js',
    index: './devAssets/js/index.js',
    jogos: './devAssets/js/jogos.js',
    localidades: './devAssets/js/localidades.js',
    main: './devAssets/js/main.js',
    packages: './devAssets/js/packages.js',
    print: './devAssets/js/print.js',
    printFunctions: './devAssets/js/printFunctions.js',
    sincronizacao: './devAssets/js/sincronizacao.js',
    substituicoesCustomSelect: './devAssets/js/substituicoesCustomSelect.js',
    torneios: './devAssets/js/torneios.js',
    utilizadores: './devAssets/js/utilizadores.js',
    styles: './devAssets/css/styles.scss',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'assets'),
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('autoprefixer')],
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.ttf$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
          },
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
  ],
};