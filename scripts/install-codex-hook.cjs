#!/usr/bin/env node
/*
 * Install this plugin's Codex hook into ~/.codex/hooks.json.
 * The hook script is copied into ~/.codex/hooks/explain-c-module/ first, so
 * the installed configuration does not depend on this checkout's location.
 * Use --uninstall to remove only this plugin's hook and copy.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const pluginRoot = path.resolve(__dirname, '..');
const configDir = path.resolve(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'));
const configFile = path.join(configDir, 'hooks.json');
const installDir = path.join(configDir, 'hooks', 'explain-c-module');
const installedScript = path.join(installDir, 'explain-commit-codex.cjs');
const scriptName = 'explain-commit-codex.cjs';
const sourceScript = path.join(pluginRoot, 'scripts', scriptName);

const hookEntry = {
  matcher: 'Bash',
  hooks: [{
    type: 'command',
    command: `node "${installedScript}"`,
    timeout: 15,
    statusMessage: 'Checking committed C/C++ files for explain-c-module...',
  }],
};

function readConfig() {
  try { return JSON.parse(fs.readFileSync(configFile, 'utf8')); }
  catch (_) { return {}; }
}

function writeConfig(config) {
  fs.mkdirSync(configDir, { recursive: true });
  const tempFile = `${configFile}.tmp-${process.pid}`;
  fs.writeFileSync(tempFile, JSON.stringify(config, null, 2) + '\n');
  fs.renameSync(tempFile, configFile);
}

function isExplainCommand(command) {
  return typeof command === 'string' && command.includes(scriptName);
}

// Remove entries installed by an earlier version while preserving unrelated hooks.
function removeExplainEntries(config) {
  config.hooks = config.hooks || {};
  const entries = Array.isArray(config.hooks.PostToolUse) ? config.hooks.PostToolUse : [];
  let removed = false;
  config.hooks.PostToolUse = entries
    .map(entry => {
      if (!entry || !Array.isArray(entry.hooks)) return entry;
      const hooks = entry.hooks.filter(hook => {
        const match = isExplainCommand(hook && hook.command);
        if (match) removed = true;
        return !match;
      });
      return hooks.length === entry.hooks.length ? entry : { ...entry, hooks };
    })
    .filter(entry => !(entry && Array.isArray(entry.hooks) && entry.hooks.length === 0));
  return removed;
}

function install() {
  if (!fs.existsSync(sourceScript)) throw new Error(`Missing hook script: ${sourceScript}`);
  fs.mkdirSync(installDir, { recursive: true });
  fs.copyFileSync(sourceScript, installedScript);

  const config = readConfig();
  removeExplainEntries(config); // migrate checkout-dependent old entries
  config.hooks = config.hooks || {};
  config.hooks.PostToolUse = Array.isArray(config.hooks.PostToolUse) ? config.hooks.PostToolUse : [];
  config.hooks.PostToolUse.push(hookEntry);
  writeConfig(config);

  console.log(`Codex hook installed: ${configFile}`);
  console.log(`Hook script copied to: ${installedScript}`);
}

function uninstall() {
  const config = readConfig();
  const removed = removeExplainEntries(config);
  if (removed) writeConfig(config);
  if (fs.existsSync(installedScript)) fs.unlinkSync(installedScript);
  if (fs.existsSync(installDir) && fs.readdirSync(installDir).length === 0) fs.rmdirSync(installDir);
  console.log(`Codex hook ${removed ? 'uninstalled' : 'not present'}: ${configFile}`);
}

try {
  if (process.argv.includes('--uninstall')) uninstall();
  else install();
} catch (error) {
  console.error(`Codex hook installation failed: ${error.message}`);
  process.exitCode = 1;
}
