import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default  {
  mode: 'production',
  target: 'web',
  entry: {
    background: path.join(__dirname, 'src', 'background', 'index.js'),
    popup: path.join(__dirname, 'src', 'pages', 'popup', 'index.jsx'),
    response: path.join(__dirname, 'src', 'pages', 'response', 'index.jsx')
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'response', 'index.html'),
      filename: 'response.html',
      chunks: ['response'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'instructions.html'),
      filename: 'instructions.html',
      chunks: ['instructions'],
      cache: false,
    }),
    new CopyPlugin({
      patterns: [{
        from: path.resolve('manifest.json'),
        to: path.resolve('build')
      }]
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/components/icons/icon16.png',
          to: path.join(__dirname, 'build/icons'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/components/icons/icon32.png',
          to: path.join(__dirname, 'build/icons'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/components/icons/icon48.png',
          to: path.join(__dirname, 'build/icons'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/components/icons/icon128.png',
          to: path.join(__dirname, 'build/icons'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/components/bg/bg.webm',
          to: path.join(__dirname, 'build/bg'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/components/bg/bg.webp',
          to: path.join(__dirname, 'build/bg'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'pages', 'Update.cmd'), // Добавляем Update.cmd
          to: path.resolve(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'pages', 'genreg.ps1'), // Добавляем genreg.ps1
          to: path.resolve(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'pages', 'install.cmd'), // Добавляем install.cmd
          to: path.resolve(__dirname, 'build'),
          force: true,
        },
      ],
    }),
  ],  
  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-react', {'runtime': 'automatic'}]
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(webm|webp)$/,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
