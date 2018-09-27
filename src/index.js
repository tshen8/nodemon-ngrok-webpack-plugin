import ngrok from 'ngrok';
import nodemon from 'nodemon';
import boxen from 'boxen';

class NodemonNgrokPlugin {
  constructor({ ngrokConfig = {}, nodemonConfig = {} } = {}) {
    this.ngrokConfig = ngrokConfig;
    this.nodemonConfig = nodemonConfig;
    this.watchMode = false;
    this.running = false;
  }

  apply(compiler) {
    compiler.hooks.watchRun.tapAsync('NodemonNgrokPlugin', (compilation, done) => {
      this.watchMode = true;
      return done();
    });

    compiler.hooks.afterEmit.tapAsync('NodemonNgrokPlugin', async (compilation, done) => {
      // Only run with webpack --watch
      if (this.watchMode && !this.running) {
        try {
          const url = await ngrok.connect({
            addr: 3000,
            ...this.ngrokConfig,
          });
          console.log(
            '\x1b[34m',
            boxen(
              `ngrok Tunnel Running at: ${url}\nngrok Client: http://localhost:4040`,
              { padding: 1, margin: 1, borderStyle: 'double' },
            ),
          );

          const assets = Object.keys(compilation.assets).filter(asset => !asset.includes('.map'));
          const defaultOutput = compilation.assets[assets[0]].existsAt;
          const monitor = nodemon({
            script: defaultOutput,
            watch: defaultOutput,
            delay: '250',
            ...this.nodemonConfig,
          });
          monitor.on('log', ({ colour: colouredMessage }) => console.log(colouredMessage));

          this.running = true;

          // Kill ngrok and nodemon when webpack exits
          process.once('exit', () => {
            ngrok.kill();
            monitor.emit('exit');
          });

          // Ensure Ctrl+C triggers exit
          process.once('SIGINT', () => {
            process.exit(0);
          });
        } catch (err) {
          compilation.errors.push(err);
        }
      }

      return done();
    });
  }
}

module.exports = NodemonNgrokPlugin;
