#!/usr/bin/env node
/**
 * Create symlinks in a subdomain to shared folders.
 * Usage: pnpm run setup-symlinks -- <subdomain-path> [shared-path]
 */

import fs from 'node:fs';
import path from 'node:path';
import { root, sharedDir, sharedFolders } from './config.js';

const subdomainPath = process.argv[2];
if (!subdomainPath) {
	console.error('Usage: node scripts/setup-symlinks.js <subdomain-path> [shared-path]');
	process.exit(1);
}

const subdomainDir = path.resolve(root, subdomainPath);
const shared = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : sharedDir;

if (!fs.existsSync(shared)) {
	console.error(`Shared directory not found: ${shared}`);
	process.exit(1);
}

const subdomainSrc = path.join(subdomainDir, 'src');
if (!fs.existsSync(subdomainSrc)) {
	console.error(`Subdomain src not found: ${subdomainSrc}`);
	process.exit(1);
}

const relToShared = path.relative(subdomainSrc, shared);
const type = 'dir';

for (const name of sharedFolders) {
	const target = path.join(shared, name);
	const linkPath = path.join(subdomainSrc, name);
	if (!fs.existsSync(target)) continue;
	if (fs.existsSync(linkPath)) {
		const stat = fs.lstatSync(linkPath);
		if (stat.isSymbolicLink()) {
			fs.unlinkSync(linkPath);
		} else {
			console.warn(`Skipping ${name}: not a symlink (remove manually to replace).`);
			continue;
		}
	}
	const targetRelative = path.join(relToShared, name);
	fs.symlinkSync(targetRelative, linkPath, type);
	console.log(`Linked src/${name} -> ${targetRelative}`);
}

console.log('Symlinks created.');
