#!/usr/bin/env node
/**
 * Scaffold: create Astro v6 project, copy folders to shared/, create one subdomain with symlinks.
 * Run: pnpm run scaffold
 * Options from package.json astro_config_federation; override with SUBDOMAIN_NAME.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
	root,
	subdomainsDir,
	sharedDir,
	defaultSubdomainName,
	sharedFolders,
	scaffoldConfig,
} from './config.js';

/** @type {string} */
const name = process.env.SUBDOMAIN_NAME || defaultSubdomainName;
const subdomainDir = path.join(subdomainsDir, name);

async function cpDir(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) await cpDir(srcPath, destPath);
		else await fs.copyFile(srcPath, destPath);
	}
}

async function rmDir(dir) {
	if (!(await fs.exists(dir))) return;
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) await rmDir(p);
		else await fs.unlink(p);
	}
	await fs.rmdir(dir);
}

async function main() {
	try {
		await fs.mkdir(subdomainsDir, { recursive: true });
		if (await fs.exists(subdomainDir)) {
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
		await fs.mkdir(sharedDir, { recursive: true });

		for (const folder of sharedFolders) {
			const src = path.join(subdomainSrc, folder);
			if (await fs.exists(src)) {
				const dest = path.join(sharedDir, folder);
				if (await fs.exists(dest)) await rmDir(dest);
				await cpDir(src, dest);
				console.log(`Copied src/${folder} -> shared/${folder}`);
			}
		}

		const consts = path.join(subdomainSrc, 'consts.ts');
		if (await fs.exists(consts)) {
			await fs.copyFile(consts, path.join(sharedDir, 'consts.ts'));
			console.log('Copied consts.ts -> shared/');
		}

		const relToShared = path.relative(subdomainSrc, sharedDir);
		for (const folder of sharedFolders) {
			const linkPath = path.join(subdomainSrc, folder);
			if (!(await fs.exists(linkPath))) continue;
			await rmDir(linkPath);
			const targetRelative = path.join(relToShared, folder);
			await fs.symlink(targetRelative, linkPath, 'dir');
			console.log(`Linked subdomain src/${folder} -> shared/${folder}`);
		}

		console.log('\nScaffold done.');
		console.log('  shared/     – shared components, layouts, styles, assets');
		console.log(`  subdomains/${name}/ – first subdomain with symlinks`);
		console.log(`  Build: pnpm run build:subdomain -- subdomains/${name}`);
	} catch (err) {
		console.error('Scaffold failed:', err);
		process.exit(1);
	}
}

await main();
