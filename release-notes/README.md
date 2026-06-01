# Release notes → GitHub releases

Markdown release notes live here, one file per marketing version:

```
release-notes/<version>.md     e.g. release-notes/1.1.2.md
```

`<version>` is the clean marketing version (no `-beta`, no codename, no sequence).
The drafting script derives it from the release tag: `v1.1.2-beta.1` → `1.1.2`.

## Naming conventions (from 1.1.1)

- **GitHub release title:** `Angora <version>` only — e.g. `Angora 1.1.2`. No `-beta.x`,
  no codename. (`draft_release.sh` sets this automatically.)
- **Note opener (first heading in the `.md`):** `# Angora <version>-beta.<n>` — e.g.
  `# Angora 1.1.2-beta.1`.
- **Tag:** `v<version>-beta.<n>` — e.g. `v1.1.2-beta.1`.
- **Release type:** full release, **not** a pre-release (the repo is already the Beta
  channel). It becomes **Latest** automatically on publish. GitHub won't let a draft be
  marked Latest, so that applies when you publish, not at draft creation.

## Cutting a release

1. Build the DMG in the **Angora** repo (`./scripts/create_beta_dmg.sh`). It lands
   at `Angora/Angora-Beta-<build>.dmg`.
2. Write / review `release-notes/<version>.md` here.
3. From this repo, create the draft release:

   ```bash
   ./scripts/draft_release.sh v1.1.2-beta.1
   ```

   This creates a **draft, pre-release** GitHub release whose body is the Markdown
   file, with the DMG attached. Tag → version, codename, title, notes path and DMG
   path are all auto-resolved (codename + build come from
   `../Angora/Configs/App-Beta.xcconfig`). Override any of them with
   `--notes`, `--dmg`, `--title`, `--main-repo`, `--repo`.

4. Review the draft on GitHub, then **Publish**. Publishing triggers
   `update-appcast.yml`, which signs the DMG and updates `appcast-beta.xml`.

## Refreshing notes on an existing release

```bash
./scripts/draft_release.sh v1.1.2-beta.1 --update
```

Edits the release's title/body from the Markdown file without touching the DMG.

See `scripts/draft_release.sh --help` for all options.
