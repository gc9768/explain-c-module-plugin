#!/usr/bin/env node
/* Merge this plugin's Codex hook into ~/.codex/hooks.json. Run explicitly by the user. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const pluginRoot = path.resolve(__dirname, '..');
const configDir = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'));
const configFile = path.join(configDir, 'hooks.json');
let config = {};
try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch (_) { /* create it */ }
config.hooks = config.hooks || {};
config.hooks.PostToolUse = config.hooks.PostToolUse || [];
const command = `node "${path.join(pluginRoot, 'scripts', 'explain-commit-codex.cjs')}"`;
const exists = config.hooks.PostToolUse.some(entry => (entry.hooks || []).some(h => h.command === command));
if (!exists) {
  config.hooks.PostToolUse.push({ matcher: 'Bash', hooks: [{ type: 'command', command, timeout: 15, statusMessage: 'Checking committed C/C++ files for explain-c-module...' }] });
}
fs.mkdirSync(configDir, { recursive: true });
fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');
console.log(`Codex hook ${exists ? 'already installed' : 'installed'}: ${configFile}`);
