#!/usr/bin/env node
/**
 * Scaffold: create Astro v6 project, copy folders to shared/, create one subdomain with symlinks.
 * Run: pnpm run scaffold
 * Options from package.json astro_config_federation; override with SUBDOMAIN_NAME.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
	root,
	subdomainsDir,
	sharedDir,
	defaultSubdomainName,
	sharedFolders,
	scaffoldConfig,
} from './config.js';

const name = process.env.SUBDOMAIN_NAME || defaultSubdomainName;
const subdomainDir = path.join(subdomainsDir, name);

function cpDir(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	for (const e of fs.readdirSync(src, { withFileTypes: true })) {
		const s = path.join(src, e.name);
		const d = path.join(dest, e.name);
		if (e.isDirectory()) cpDir(s, d);
		else fs.copyFileSync(s, d);
	}
}

function rmDir(dir) {
	if (!fs.existsSync(dir)) return;
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) rmDir(p);
		else fs.unlinkSync(p);
	}
	fs.rmdirSync(dir);
}

fs.mkdirSync(subdomainsDir, { recursive: true });
if (fs.existsSync(subdomainDir)) {
	console.error(`Subdomain already exists: ${subdomainDir}. Remove it or set SUBDOMAIN_NAME.`);
	process.exit(1);
}

const astroPkg = scaffoldConfig.astroVersion === 'latest' ? 'astro@latest' : `astro@${scaffoldConfig.astroVersion}`;
console.log(`Creating Astro project (${astroPkg}, template: ${scaffoldConfig.template})...`);

const args = [
	'create',
	astroPkg,
	subdomainDir,
	'--',
	'--template', scaffoldConfig.template,
	'--typescript', scaffoldConfig.typescript,
	'--yes',
];
if (scaffoldConfig.install) args.push('--install');
if (!scaffoldConfig.git) args.push('--no-git');

const create = spawnSync('pnpm', args, { cwd: root, stdio: 'inherit', shell: true });
if (create.status !== 0) {
	console.error('create-astro failed.');
	process.exit(create.status ?? 1);
}

const subdomainSrc = path.join(subdomainDir, 'src');
fs.mkdirSync(sharedDir, { recursive: true });

for (const folder of sharedFolders) {
	const src = path.join(subdomainSrc, folder);
	if (fs.existsSync(src)) {
		const dest = path.join(sharedDir, folder);
		if (fs.existsSync(dest)) rmDir(dest);
		cpDir(src, dest);
		console.log(`Copied src/${folder} -> shared/${folder}`);
	}
}
const consts = path.join(subdomainSrc, 'consts.ts');
if (fs.existsSync(consts)) {
	fs.copyFileSync(consts, path.join(sharedDir, 'consts.ts'));
	console.log('Copied consts.ts -> shared/');
}

const relToShared = path.relative(subdomainSrc, sharedDir);
for (const folder of sharedFolders) {
	const linkPath = path.join(subdomainSrc, folder);
	if (!fs.existsSync(linkPath)) continue;
	rmDir(linkPath);
	const targetRelative = path.join(relToShared, folder);
	fs.symlinkSync(targetRelative, linkPath, 'dir');
	console.log(`Linked subdomain src/${folder} -> shared/${folder}`);
}

console.log('\nScaffold done.');
console.log('  shared/     – shared components, layouts, styles, assets');
console.log(`  subdomains/${name}/ – first subdomain with symlinks`);
console.log(`  Build: pnpm run build:subdomain -- subdomains/${name}`);
