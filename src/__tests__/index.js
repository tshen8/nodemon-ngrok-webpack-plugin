import ngrok from 'ngrok';
import nodemon from 'nodemon';
import NodemonNgrokPlugin from '../index';

jest.mock('nodemon', () => jest.fn().mockReturnValue({
  on: (event, cb) => cb({ colour: 'coloured message' }),
  emit: jest.fn(),
}));
jest.mock('boxen', () => msg => msg);

describe('NodemonNgrokPlugin', () => {
  const compiler = {
    hooks: {
      watchRun: { tapAsync: jest.fn() },
      afterEmit: { tapAsync: jest.fn() },
    },
  };

  const compilation = {
    assets: {
      'output.map.js': { existsAt: 'dist/output.map.js' },
      'dist.js': { existsAt: 'dist/output.js' },
      'other.js': { existsAt: 'dist/other.js' },
    },
  };

  const done = jest.fn();
  const tunnelUrl = 'http://ngrok.io';

  beforeAll(() => {
    ngrok.connect = jest.fn().mockReturnValue(Promise.resolve(tunnelUrl));
    ngrok.kill = jest.fn();
    console.log = jest.fn();
    process.once = jest.fn();
    process.exit = jest.fn();
  });

  describe('only operates in webpack watch mode', () => {
    afterEach(() => { jest.clearAllMocks(); });

    test('taps into afterEmit hook, does not do anything if webpack is not running in watch mode', async () => {
      const plugin = new NodemonNgrokPlugin();
      plugin.apply(compiler);
      expect(compiler.hooks.afterEmit.tapAsync).toHaveBeenCalledWith('NodemonNgrokPlugin', expect.any(Function));

      const build = compiler.hooks.afterEmit.tapAsync.mock.calls[0][1];
      await build(compilation, done);
      expect(ngrok.connect).not.toHaveBeenCalled();
      expect(nodemon).not.toHaveBeenCalled();
      expect(done).toHaveBeenCalled();
    });

    test('taps into watchRun hook and sets watchMode to true', () => {
      const plugin = new NodemonNgrokPlugin();
      expect(plugin.watchMode).toBe(false);
      plugin.apply(compiler);
      expect(compiler.hooks.watchRun.tapAsync).toHaveBeenCalledWith('NodemonNgrokPlugin', expect.any(Function));

      const build = compiler.hooks.watchRun.tapAsync.mock.calls[0][1];
      build(compilation, done);
      expect(plugin.watchMode).toBe(true);
      expect(done).toHaveBeenCalled();
    });
  });

  describe('with default configuration', () => {
    let plugin;
    let build;

    beforeAll(() => {
      plugin = new NodemonNgrokPlugin();
      plugin.apply(compiler);
      plugin.watchMode = true;

      [[, build]] = compiler.hooks.afterEmit.tapAsync.mock.calls;
      return build(compilation, done);
    });

    afterAll(() => { jest.clearAllMocks(); });

    test('opens ngrok tunnel to port 3000', () => {
      expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining({ addr: 3000 }));
    });

    test('logs ngrok tunnel URL', () => {
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(tunnelUrl),
      );
    });

    test('filters out sourcemap files and starts a nodemon instance with the first output asset (and 250ms delay)', () => {
      expect(nodemon).toHaveBeenCalledWith(expect.objectContaining({
        script: 'dist/output.js',
        watch: 'dist/output.js',
        delay: '250',
      }));
    });

    test('listens to nodemon log events and logs messages', () => {
      expect(console.log).toHaveBeenCalledWith('coloured message');
    });

    test('sets running to true', () => {
      expect(plugin.running).toBe(true);
    });

    test('kills ngrok and nodemon on process exit', () => {
      expect(process.once).toHaveBeenCalledWith('exit', expect.any(Function));
      const exit = process.once.mock.calls[0][1];
      exit();
      expect(ngrok.kill).toHaveBeenCalled();
    });

    test('process exits (with code 0) on SIGINT signal', () => {
      expect(process.once).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      const exit = process.once.mock.calls[1][1];
      exit();
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('calls done', () => {
      expect(done).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    const error = new Error('Mock Error');

    afterAll(() => { jest.clearAllMocks(); });

    test('adds error to compilation if one is encountered', async () => {
      const plugin = new NodemonNgrokPlugin();
      plugin.apply(compiler);
      plugin.watchMode = true;

      const build = compiler.hooks.afterEmit.tapAsync.mock.calls[0][1];
      ngrok.connect.mockReturnValueOnce(Promise.reject(error));
      const compWithErrors = { ...compilation, errors: [] };
      await build(compWithErrors, done);

      expect(compWithErrors.errors).toContain(error);
      expect(done).toHaveBeenCalled();
    });
  });

  describe('with custom configuration', () => {
    let plugin;
    let build;
    const ngrokConfig = { addr: 80 };
    const nodemonConfig = { script: 'custom.js', watch: 'custom.js' };

    beforeAll(() => {
      plugin = new NodemonNgrokPlugin({ ngrokConfig, nodemonConfig });
      plugin.apply(compiler);
      plugin.watchMode = true;

      [[, build]] = compiler.hooks.afterEmit.tapAsync.mock.calls;
      return build(compilation, done);
    });

    afterAll(() => { jest.clearAllMocks(); });

    test('allows config to be passed to ngrok', () => {
      expect(ngrok.connect).toHaveBeenCalledWith(expect.objectContaining(ngrokConfig));
    });

    test('allows config to be passed to nodemon', () => {
      expect(nodemon).toHaveBeenCalledWith(expect.objectContaining(nodemonConfig));
    });
  });
});
