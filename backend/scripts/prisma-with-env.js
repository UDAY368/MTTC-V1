#!/usr/bin/env node

// This script ensures DATABASE_URL is set before running Prisma commands
import './setup-env.js';
import { execSync } from 'child_process';

// Get the command from process.argv (skip node and script name)
const args = process.argv.slice(2);
const command = args.join(' ');

if (!command) {
  console.error('Usage: node prisma-with-env.js <prisma-command>');
  process.exit(1);
}

// Pass DATABASE_URL to the child process
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL,
};

try {
  execSync(`npx prisma ${command}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: env,
  });
} catch (error) {
  process.exit(error.status || 1);
}
