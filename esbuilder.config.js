// esbuild.config.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['source/index.ts'], // Your entry point
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/bundle.js', // Output file
}).catch(() => process.exit(1));
