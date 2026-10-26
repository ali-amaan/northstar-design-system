#!/usr/bin/env node
// The @northstar-js/maps data build, in order:
//   1. build-world-geo.cjs    data/countries-50m.json + data/codes.json -> .cache/world-geo*.json
//   2. build-country-maps.cjs .cache/world-geo.json + data/market-status.json -> dist/maps/
//   3. build-data.cjs         dist/maps/ + .cache/world-geo.world.json -> src/generated/
//
//   node build/index.cjs               always rebuild
//   node build/index.cjs --if-missing  only when src/generated/ is absent (typecheck and test use this)
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PKG = path.resolve(__dirname, '..');
if (process.argv.includes('--if-missing') && fs.existsSync(path.join(PKG, 'src', 'generated', 'loaders.ts')) && fs.existsSync(path.join(PKG, 'dist', 'maps', 'index.json'))) process.exit(0);
const run = (file, args = []) => execFileSync(process.execPath, [path.join(__dirname, file), ...args], { cwd: PKG, stdio: ['ignore', 'ignore', 'inherit'] });
run('build-world-geo.cjs', ['data/countries-50m.json', 'data/codes.json', '.cache']);
run('build-country-maps.cjs');
fs.copyFileSync(path.join(PKG, 'data', 'market-status.json'), path.join(PKG, 'dist', 'maps', 'market-status.json'));
execFileSync(process.execPath, [path.join(__dirname, 'build-data.cjs')], { cwd: PKG, stdio: 'inherit' });
