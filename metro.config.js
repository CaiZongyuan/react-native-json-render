const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Ignore agent/skill folders (may contain symlinks or non-RN files that break Metro on Windows)
config.resolver.blockList = [
  /[\/\\]\.codex[\/\\].*/,
  /[\/\\]\.agents[\/\\].*/,
  /[\/\\]\.claude[\/\\].*/,
];

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file (from previous step)
  cssEntryFile: "./src/global.css",
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: "./src/uniwind-types.d.ts",
});
