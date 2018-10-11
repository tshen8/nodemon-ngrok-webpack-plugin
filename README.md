# nodemon-ngrok-webpack-plugin
[![CircleCI](https://circleci.com/gh/tshen8/nodemon-ngrok-webpack-plugin.svg?style=svg)](https://circleci.com/gh/tshen8/nodemon-ngrok-webpack-plugin) [![npm version](https://badge.fury.io/js/nodemon-ngrok-webpack-plugin.svg)](https://badge.fury.io/js/nodemon-ngrok-webpack-plugin) [![codecov](https://codecov.io/gh/tshen8/nodemon-ngrok-webpack-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/tshen8/nodemon-ngrok-webpack-plugin)

Inspired by lzhaki's [nodemon-webpack-plugin](https://github.com/Izhaki/nodemon-webpack-plugin), this plugin uses [Nodemon](https://github.com/remy/nodemon) to watch and automatically restart your Webpack output node server when Webpack is run in `--watch` mode. It then uses [ngrok](https://github.com/bubenshchykov/ngrok) to create an online tunnel to your development server.

This enables you to access your live local Webpack build from any device for easier debugging. Need to test something on a phone or tablet? No problem! Someone else's machine has a bug that can't be reproduced anywhere else? Easy-peasy!

## Installation
```bash
npm install -D nodemon-ngrok-webpack plugin
```

#### Dependencies
`nodemon-ngrok-webpack-plugin` requires Webpack >=4 to work.

## Usage
In your webpack config:
```javascript
const path = require('path');
const NodeExternals = require('webpack-node-externals');
const NodemonNgrokWebpackPlugin = require('nodemon-ngrok-webpack-plugin');

module.exports = {
    mode: 'development',
    target: 'node',
    externals: [NodeExternals()],
    entry: './src/server.js',
    output: {
        path: path.resolve('./build'),
        filename: 'server.js'
    },
    plugins: [
        // Where the magic happens
        new NodemonNgrokWebpackPlugin()
    ],
}
```

Run:
```bash
webpack --watch
```

#### Output
```bash
webpack is watching the files…
   ╔════════════════════════════════════════════════════════╗
   ║                                                        ║
   ║   ngrok Tunnel Running at: https://b30a5d06.ngrok.io   ║
   ║   ngrok Client: http://localhost:4040                  ║
   ║                                                        ║
   ╚════════════════════════════════════════════════════════╝
Hash: b977a3a88dc37e896883
Version: webpack 4.20.2
Time: 901ms
Built at: 10/11/2018 11:43:44 AM
    Asset      Size  Chunks             Chunk Names
server.js  5.42 KiB    main  [emitted]  main
Entrypoint main = server.js
[./webpack.config.js] 433 bytes {main} [built]
[nodemon-ngrok-webpack-plugin] external "nodemon-ngrok-webpack-plugin" 42 bytes {main} [built]
[path] external "path" 42 bytes {main} [built]
[webpack-node-externals] external "webpack-node-externals" 42 bytes {main} [built]
[nodemon] 1.18.4
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: build/server.js
[nodemon] starting `node build/server.js`
```

### Configuration and Defaults

#### Nodemon
By default, Nodemon has been configured to run and watch the first output file of your Webpack build. It has also been set to a `250ms` delay to give Webpack a chance to finish its build before restarting the node server.

```javascript
{
    script: defaultOutput,
    watch: defaultOutput,
    delay: '250'
}
```

These settings can be overridden and any other [Nodemon configuration](https://github.com/remy/nodemon#config-files) properties can be added

```javascript
new NodemonNgrokWebpackPlugin({
    nodemonConfig: {
        script: './build/aux.js', // What to run
        watch: path.resolve('./build'),  // What to watch
        args: ['example'], // Arguments to pass to script
        verbose: true, // Verbose
        // etc...
    },
});
```

#### Ngrok

By default, Ngrok has been configured to tunnel to port `3000` over the `http` protocol

```javascript
{ addr: 3000 }
```

These settings can also be overridden and any other [Ngrok configuration](https://ngrok.com/docs#config-options) properties can be added

```javascript
new NodemonNgrokWebpackPlugin({
    ngrokConfig: {
        addr: 8080, // Port to tunnel to
        authtoken: '4nq9771bPxe8ctg7LKr_2ClH7Y15Zqe4bWLWF9p', // Ngrok auth token
        subdomain: 'example', // Reserved tunnel name
        bind_tls: false, // Disable HTTPS
        // etc...
    },
});
```
