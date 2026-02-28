Astro_v6/
├── shared/                    # Common root – symlink targets
│   ├── components/            # Shared components (Header, Footer, etc.)
│   ├── layouts/               # Shared layouts
│   ├── styles/                # Shared CSS (global.css, etc.)
│   ├── assets/                # Shared images, fonts
│   └── consts.ts              # Shared constants
│
├── liberal.rf/                # Domain root
│   ├── base/                  # Subdomain: base.liberal.rf or liberal.rf
│   │   ├── src/
│   │   │   ├── components -> ../../../shared/components
│   │   │   ├── layouts -> ../../../shared/layouts
│   │   │   ├── styles -> ../../../shared/styles
│   │   │   ├── pages/        # Subdomain-specific pages
│   │   │   └── content/      # Subdomain-specific content
│   │   ├── astro.config.mjs
│   │   └── package.json
│   │
│   └── main/                  # Subdomain: main.liberal.rf
│       ├── src/
│       │   ├── components -> ../../../shared/components
│       │   ├── layouts -> ../../../shared/layouts
│       │   ├── styles -> ../../../shared/styles
│       │   ├── pages/
│       │   └── content/
│       ├── astro.config.mjs
│       └── package.json
│
├── scripts/
│   ├── build-subdomain.sh     # Build single subdomain
│   ├── build-all.sh           # Build all subdomains
│   └── setup-symlinks.sh      # Create symlinks for new subdomains
│
└── package.json               # Root workspace (optional)

---

## 1. Node.js-скрипты в `scripts/`

| Файл | Назначение |
|------|------------|
| **`build-subdomain.js`** | Сборка одного поддомена: `pnpm run build:subdomain -- subdomains/default` |
| **`build-all.js`** | Сборка всех поддоменов в `subdomains/` (или в каталоге из `SUBDOMAINS_DIR`) |
| **`setup-symlinks.js`** | Создаёт симлинки в поддомене на `shared/`: `pnpm run setup-symlinks -- subdomains/default` |
| **`scaffold.js`** | Разовый сетап: создаёт проект Astro 6, копирует папки в `shared/`, создаёт один поддомен с симлинками |

---

## 2. Пакет **`astro_config_federation`**

- **Имя:** `astro_config_federation`
- **Тип:** ES module, Node ≥22.12
- **Сборка:** через pnpm (корень репозитория — пакет)

В **`package.json`** добавлены скрипты:

```json
"scaffold": "node scripts/scaffold.js",
"build:subdomain": "node scripts/build-subdomain.js",
"build:all": "node scripts/build-all.js",
"setup-symlinks": "node scripts/setup-symlinks.js"
```

Оставлены ваши скрипты Astro: `dev`, `build`, `preview`, `astro`.

---

## 3. Публикация в npm

- **`files`:** в пакет попадают только `scripts` и `shared` (в npm не попадут `node_modules`, `dist`, `src` и т.д.).
- **`exports`:** подпути для скриптов, например:
  - `astro_config_federation/scripts/scaffold`
  - `astro_config_federation/scripts/build-subdomain`
  - и т.д.

После `pnpm publish` пользователи смогут ставить пакет и вызывать скрипты через свои `package.json` или `npx`.

---

## 4. Ручной скрипт **scaffold**

Запуск в корне (в окружении pnpm/node):

```bash
pnpm run scaffold
```

Он:

1. Вызывает **`pnpm create astro@latest subdomains/<имя> -- --template basics --install --no-git --typescript strict --yes`** (типовой Astro 6).
2. Копирует из созданного проекта в **`shared/`**: `components`, `layouts`, `styles`, `assets`, при наличии — `consts.ts`.
3. Удаляет эти папки в поддомене и создаёт в `subdomains/<имя>/src/` симлинки на `shared/`.

Имя поддомена по умолчанию — `default`; можно задать свой: `SUBDOMAIN_NAME=myapp pnpm run scaffold`.

---

## 5. Как вызывать скрипты

```bash
# Один раз настроить структуру и первый поддомен
pnpm run scaffold

# Собрать один поддомен
pnpm run build:subdomain -- subdomains/default

# Собрать все поддомены
pnpm run build:all

# Настроить симлинки для существующего поддомена (например, нового)
pnpm run setup-symlinks -- subdomains/new-site
```

Опционально: `SUBDOMAINS_DIR` и `SHARED_DIR` в `build-all.js` и `setup-symlinks.js` задают каталоги поддоменов и shared.

Если нужно, могу подсказать, как добавить в репозиторий `shared/` и `subdomains/` в `.gitignore` или, наоборот, закоммитить только структуру без сгенерированного Astro.

Кратко, что сделано:

---

