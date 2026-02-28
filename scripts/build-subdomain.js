#!/usr/bin/env node
/**
 * Build a single subdomain. Usage: node scripts/build-subdomain.js <subdomain-path>
 * Example: pnpm run build:subdomain -- subdomains/default
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { root } from './config.js';

const subdomainPath = process.argv[2];
if (!subdomainPath) {
	console.error('Usage: node scripts/build-subdomain.js <subdomain-path>');
	console.error('Example: pnpm run build:subdomain -- subdomains/default');
	process.exit(1);
}

const subdomainDir = path.resolve(root, subdomainPath);
if (!fs.existsSync(subdomainDir)) {
	console.error(`Subdomain directory not found: ${subdomainDir}`);
	process.exit(1);
}
const pkgPath = path.join(subdomainDir, 'package.json');
if (!fs.existsSync(pkgPath)) {
	console.error(`No package.json in subdomain: ${subdomainDir}`);
	process.exit(1);
}

const child = spawn('pnpm', ['run', 'build'], {
	cwd: subdomainDir,
	stdio: 'inherit',
	shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
