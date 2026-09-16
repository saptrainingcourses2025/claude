#!/usr/bin/env node

// Simple hook to block deletion of critical files
let data = '';

process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const cmd = JSON.parse(data).tool_input?.command || '';
    
    // Block if trying to delete .env, package.json, or db.sqlite
    const protectedFiles = ['.env', 'package.json', 'db.sqlite'];
    const isDangerous = /^(rm|del|Remove-Item)/i.test(cmd) &&
                        protectedFiles.some(file => cmd.includes(file));
    
    if (isDangerous) {
      console.error('🛑 Cannot delete: .env, package.json, or db.sqlite');
      process.exit(2);
    }
    
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
});
