
# astro_config_federation (Alpha)

> **Alpha status – not for production use.**  
> This package is experimental and under active development.  
> It is currently being tested against **Astro 6** and may change at any time.

`astro_config_federation` is a small helper library for **federating an Astro monorepo into multiple subdomains** that:

- live in a **single repository**,  
- share a **common root folder** with reusable code, and  
- can be **built and deployed independently** (per subdomain).

It focuses on:

- extracting **shared components/layouts/styles/assets** into a central `shared/` directory,
- creating **symlinks** from each subdomain back to that shared root, and
- providing **Node.js scripts** (intended for `pnpm` usage) to:
  - scaffold a new Astro 6 subdomain,
  - manage shared folders,
  - and run subdomain builds.

---

## Status & Disclaimer

- **Stage:** Alpha / experimental.  
- **Target stack:** Node.js ≥ 22, `pnpm`, Astro **v6** (latest generation).  
- **Production readiness:** **Not recommended** for production yet.
- **Compatibility:** Behavior and APIs may change without notice while testing continues on the latest Astro 6 releases.

Use it only for experiments, prototypes, or internal tooling until it stabilizes.

---

## What This Module Does

### High‑level capabilities

- **Scaffold a new Astro 6 subdomain**
  - Uses `pnpm create astro@<version>` with typical options:
    - template: `basics`
    - TypeScript: `strict`
    - installs dependencies
    - does **not** initialize git inside the subdomain
- **Extract shared code to a common root**
  - Copies selected folders from the generated subdomain into a top‑level `shared/` directory:
    - `components/`
    - `layouts/`
    - `styles/`
    - `assets/`
    - optionally `consts.ts` (if present)
- **Create symlinks from subdomain to shared**
  - Replaces the copied folders inside `subdomains/<name>/src/` with symlinks pointing back to `shared/`.
  - This allows multiple subdomains to share the same implementation while keeping separate `astro.config.mjs`, `content.config.ts`, and `pages/`.
- **Build per subdomain or all subdomains**
  - Run build for one specific subdomain.
  - Run builds for all subdomains under a configured `subdomains/` folder.

The goal is to make it easy to maintain **several Astro sites / subdomains** that share a lot of UI and layout structure, without duplicating directories or fighting the build setup.

---

## Scripts

These scripts are defined in `package.json` of `astro_config_federation` and are intended to be run with `pnpm`:

- **`pnpm run scaffold`**  
  Creates a new Astro 6 project in `subdomains/<name>/`, copies shared folders to `shared/`, and rewires the subdomain to use symlinks.

- **`pnpm run build:subdomain -- <subdomain-path>`**  
  Builds a single subdomain (e.g. `subdomains/default`), simply running `pnpm run build` in that directory.

- **`pnpm run build:all`**  
  Builds **all** subdomains found in the `subdomainsDir` (by default `subdomains/`), skipping any directories that do not contain a `package.json`.

- **`pnpm run setup-symlinks -- <subdomain-path> [shared-path]`**  
  Recreates symlinks for an existing subdomain, pointing `src/components`, `src/layouts`, etc. to the central `shared/` directory.

> These commands are thin wrappers around the Node.js scripts in `scripts/` and are configured primarily for `pnpm` workflows.

---

## Configuration

Module behavior is configured via the `astro_config_federation` block in the package’s own `package.json`:

```json
{
  "name": "astro_config_federation",
  "version": "0.1.0",
  "astro_config_federation": {
    "sharedDir": "shared",
    "subdomainsDir": "subdomains",
    "defaultSubdomainName": "default",
    "sharedFolders": ["components", "layouts", "styles", "assets"],
    "scaffold": {
      "astroVersion": "latest",
      "template": "basics",
      "typescript": "strict",
      "install": true,
      "git": false
    }
  }
}
```

### Fields

- **`sharedDir`**  
  Relative path to the directory containing shared code. Defaults to `shared`.

- **`subdomainsDir`**  
  Relative path where all subdomains live. Defaults to `subdomains`.

- **`defaultSubdomainName`**  
  Name used by `scaffold` when no `SUBDOMAIN_NAME` environment variable is provided. Default: `default`.

- **`sharedFolders`**  
  List of folder names inside `src/` that will be copied to `shared/` and then turned into symlinks:
  - commonly: `["components", "layouts", "styles", "assets"]`.

- **`scaffold.astroVersion`**  
  Version string passed to `pnpm create astro@...`.  
  - `"latest"` by default (i.e. the latest Astro 6 CLI at runtime).

- **`scaffold.template`**  
  Template name for `create-astro` (`"basics"` by default).

- **`scaffold.typescript`**  
  TypeScript option passed to the CLI (`"strict"` by default).

- **`scaffold.install`**  
  If `true`, `create-astro` installs dependencies after scaffolding.  

- **`scaffold.git`**  
  If `true`, `create-astro` may initialize a git repo in the subdomain.  
  Default is `false` (git initialization is skipped inside subdomains).

You can also override some behavior with environment variables, e.g.:

- `SUBDOMAIN_NAME` – overrides `defaultSubdomainName` for a single `scaffold` run.
- `SUBDOMAINS_DIR` – overrides `subdomainsDir` for `build-all`.

---

## Typical Workflow

1. **Initialize the module repo**  
   - Place `astro_config_federation` as a separate package (or as part of a monorepo).
   - Commit only:
     - `package.json`
     - `scripts/`
     - `shared/.gitkeep`
     - `.gitignore`

2. **Scaffold the first subdomain**

   ```bash
   pnpm run scaffold
   ```

   This will:

   - run `pnpm create astro@<astroVersion>` into `subdomains/<defaultSubdomainName>/`,
   - copy configured `sharedFolders` from `subdomains/<name>/src/` into `shared/`,
   - replace those folders in `subdomains/<name>/src/` with symlinks.

3. **Customize each subdomain**

   - Adjust `astro.config.mjs`, routes in `src/pages`, and content collections (`content.config.ts`) per subdomain.
   - Reuse shared layouts/components/styles from the `shared/` directory.

4. **Build subdomains**

   - Single subdomain:

     ```bash
     pnpm run build:subdomain -- subdomains/default
     ```

   - All subdomains:

     ```bash
     pnpm run build:all
     ```

---

## Limitations & Known Caveats (Alpha)

- **Not production ready.** Expect breaking changes while the design is still evolving.
- The module assumes a **pnpm + Node ≥ 22** environment.
- **Astro 6 only** has been the focus of testing so far; earlier versions are not supported.
- Symlink behavior may vary on some operating systems or hosting environments.
- The package does **not** manage Astro integrations, content collections, or deployment configuration; these remain the responsibility of each subdomain’s project.

---

## Roadmap / Future Ideas

- Better support for:
  - multiple root `shared/` layers (per brand / per domain),
  - more advanced configuration of which files are shared vs. per‑subdomain only.
- Additional helpers for:
  - scanning for duplicate folders and suggesting what to move into `shared/`,
  - generating CI build matrices per subdomain.
- Hardening against edge cases in different Astro 6 minor versions and hosting targets.

---

## License

This project is licensed under the **MIT License**.
