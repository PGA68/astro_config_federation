#!/usr/bin/env node
/**
 * Build all subdomains. Path from package.json astro_config_federation.subdomainsDir or env SUBDOMAINS_DIR.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { root, subdomainsDir } from './config.js';

const dir = process.env.SUBDOMAINS_DIR ? path.resolve(process.cwd(), process.env.SUBDOMAINS_DIR) : subdomainsDir;

if (!fs.existsSync(dir)) {
	console.error(`Subdomains directory not found: ${dir}`);
	process.exit(1);
}

const entries = fs.readdirSync(dir, { withFileTypes: true });
const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

if (dirs.length === 0) {
	console.warn('No subdomain directories found.');
	process.exit(0);
}

let failed = 0;
for (const name of dirs) {
	const subdomainPath = path.join(dir, name);
	const pkgPath = path.join(subdomainPath, 'package.json');
	if (!fs.existsSync(pkgPath)) continue;
	console.log(`\n--- Building subdomain: ${name} ---\n`);
	const result = spawnSync('pnpm', ['run', 'build'], {
		cwd: subdomainPath,
		stdio: 'inherit',
		shell: true,
	});
	if (result.status !== 0) failed += 1;
}

if (failed > 0) {
	console.error(`\n${failed} subdomain(s) failed to build.`);
	process.exit(1);
}
console.log('\nAll subdomains built successfully.');
