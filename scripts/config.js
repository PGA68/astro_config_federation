/**
 * Load astro_config_federation config from package.json (root = parent of scripts/).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const cfg = pkg.astro_config_federation || {};

export const sharedDir = path.resolve(root, cfg.sharedDir ?? 'shared');
export const subdomainsDir = path.resolve(root, cfg.subdomainsDir ?? 'subdomains');
export const defaultSubdomainName = cfg.defaultSubdomainName ?? 'default';
export const sharedFolders = cfg.sharedFolders ?? ['components', 'layouts', 'styles', 'assets'];
export const scaffoldConfig = {
	astroVersion: cfg.scaffold?.astroVersion ?? 'latest',
	template: cfg.scaffold?.template ?? 'basics',
	typescript: cfg.scaffold?.typescript ?? 'strict',
	install: cfg.scaffold?.install !== false,
	git: cfg.scaffold?.git === true,
};

export { root };
