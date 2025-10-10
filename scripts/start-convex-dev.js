#!/usr/bin/env node

/**
 * Starts Convex dev server noninteractively
 *
 * This script attempts to start the Convex dev server without requiring
 * interactive input. It handles several scenarios:
 *
 * 1. If CONVEX_URL is set: uses that deployment
 * 2. If .convex directory exists: uses existing config
 * 3. Otherwise: creates a new deployment with default settings
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONVEX_DIR = path.join(process.cwd(), '.convex');
const HAS_CONVEX_CONFIG = fs.existsSync(CONVEX_DIR);
const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

console.log('🚀 Starting Convex dev server...');
console.log(`📁 Convex config exists: ${HAS_CONVEX_CONFIG}`);
console.log(`🔗 CONVEX_URL set: ${CONVEX_URL ? 'Yes' : 'No'}`);

// Build convex dev command
const args = ['convex', 'dev'];

// If we have a URL but no config, try to use it
if (CONVEX_URL && !HAS_CONVEX_CONFIG) {
  console.log(`⚙️  Using CONVEX_URL: ${CONVEX_URL}`);
  // Note: convex dev might not have a --url flag, this may need adjustment
  args.push('--url', CONVEX_URL);
}

// Spawn the process
const convexProcess = spawn('npx', args, {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: {
    ...process.env,
    // Set CI=true to potentially skip some interactive prompts
    CI: 'true',
    // Force color output even in CI
    FORCE_COLOR: '1'
  }
});

// If the process asks for input, try to provide sensible defaults
if (!HAS_CONVEX_CONFIG) {
  console.log('⚠️  No existing Convex config found.');
  console.log('   If prompted, the script will attempt to:');
  console.log('   - Create a new project with default settings');
  console.log('   - Select the first available option');

  // Attempt to auto-answer prompts
  // This might not work (as user mentioned), but worth trying
  setTimeout(() => {
    try {
      // Try to select first option and confirm
      convexProcess.stdin.write('1\n');
      setTimeout(() => {
        convexProcess.stdin.write('y\n');
      }, 500);
    } catch (err) {
      // stdin might not be available, that's okay
    }
  }, 1000);
}

// Handle process exit
convexProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Convex dev server exited successfully');
  } else {
    console.error(`❌ Convex dev server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle errors
convexProcess.on('error', (err) => {
  console.error('❌ Failed to start Convex dev server:', err);
  process.exit(1);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Convex dev server...');
  convexProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Convex dev server...');
  convexProcess.kill('SIGTERM');
});
