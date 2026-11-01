# My Personal Page

This is the source code for my personal website.

## Local preview

With Ruby and Bundler installed:

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Open `http://127.0.0.1:4000`. Jekyll rebuilds when source files change.

The interactive portfolio uses `_layouts/terminal.html`,
`assets/css/terminal.css`, `assets/js/terminal.js`, and the virtual filesystem
in `assets/js/terminal-fs.js`. The homepage starts
with an empty prompt; visitors reveal content using `help`, `whoami`,
`research`, `research 1`, `papers`, `about`, `musings`, `talks`, `teaching`,
`news`, and `contact`. `clear` resets the screen, and `theme amber`,
`theme green`, or `theme white` changes the phosphor color. Tab completes
commands; up/down arrows navigate command history. Commands in help output
are tappable on mobile. These commands only navigate portfolio content.

The virtual filesystem supports relative/absolute paths, `cd`, `cd -`,
`pwd`, `ls -a`, `tree`, `cat`, `find . -name "*.md"`, and literal `grep`.
Try `papers --year 2022` or `papers | grep -i lipid | head 3`.
Supported pipe filters are `grep`, `head`, `sort`, and `wc -l`.
`man pipes` and `man keyboard` explain usage. Ctrl+R searches this session's
command history; Ctrl+L clears the screen; `!!` repeats the last command.
`neofetch`, `dna`, and the dotfiles add a few discoverable details.
No shell commands execute on the visitor's computer, and the virtual
filesystem never accesses their local files.

## Source layout

- `_layouts/terminal.html` is the shared page shell; page, wide, and post layouts
  wrap it for existing URLs.
- `assets/css/terminal.css` is the site's stylesheet. The standalone slide deck
  contains its own styles and navigation, without external runtime dependencies.
- `assets/js/` contains the terminal, virtual filesystem, content catalog,
  Vim reader, and tank game.
- `_data/`, `_posts/`, and `_includes/` hold the portfolio content.
- `assets/files/` retains the publication PDFs; `assets/img/` holds the favicon.
- `_site/` is generated output and can be rebuilt. Local editor state and
  `.claude/` worktrees are excluded from publication.

## Publications, search, and sharing

`papers` shows first/co-first-author highlights followed by other listed papers,
with each group ordered newest first. `papers --all` uses a single chronological
list, `papers --featured` selects the highlights, and `papers --year 2025`
filters by year. Sorting uses copies of the data: existing file names, citation
buttons, and source records retain their original identity.

`search lipid` searches publication metadata, talk titles and venues, full essay
text, research descriptions, and profile pages. All words must match, without
case sensitivity. Search results highlight matching text and open the selected
item. The index contains one record per item, not duplicate virtual-file copies.
It runs locally; it does not search external papers or send queries to a server.

Research, publication, essay, and search-result views offer **permalink** and
**copy link** actions. If clipboard access is unavailable, a selectable URL is
shown. Example routes:

- `/#research/gwas`
- `/#paper/10.1016/j.ajhg.2023.09.003`
- `/#writing/ai-assisted-statistical-genetics-coding`
- `/#search/lipid`

Paper routes use DOIs; talk IDs live in `_data/talks.yml` and should remain stable
when editing titles. `open research/gwas` and Tab completion also open items.
Links use the current origin, so local demos stay local and deployed links use
the live site's domain. Browser back/forward restores the selected content.
A homepage without a route still starts with an empty prompt.

## Input and Vim reader

Tab completes a command or path. Ambiguous input opens a candidate menu:
Up/Down or Tab/Shift+Tab selects; Enter inserts without executing; Escape
closes the menu. A matching previous command appears as gray text; Right
arrow at the end accepts it. Ctrl+C cancels input, Ctrl+A/E moves to the
start/end, and Ctrl+U/K/W deletes before/after the cursor/the previous word.
Composition events protect Chinese and other IME input from accidental
submission. Commands longer than 512 characters are rejected, not truncated.

`vim papers.bib`, `vim about.txt`, or `view writing/<filename>.md` opens the
read-only reader in `assets/js/vim-reader.js`. `/?read=papers.bib` opens a
direct reader demo. File paths support the same
completion and relative/absolute navigation as `cat`.

- `j/k` or arrows move by logical line; `gg/G` goes to the first/last line.
- Ctrl+D/U and PageDown/PageUp move half/full pages.
- `/` opens literal, case-insensitive search; `n/N` cycles matches.
- `:42` jumps to a line; `:set nonumber` / `:set number` toggles the gutter.
- `:noh` clears search highlights; `?` / `:help` shows shortcuts.
- `:q` or Escape returns to the terminal and restores focus. Escape while
  typing a search or command cancels that input first. `:w` reports read-only.

DOM behavior tests require `jsdom` (test dependency only) and a Jekyll build:

```sh
# Install test dependencies outside the site source.
npm install --prefix /tmp/yw-terminal-tests jsdom
bundle exec jekyll build
NODE_PATH=/tmp/yw-terminal-tests/node_modules node --test tests/terminal-ui.test.cjs
```

For a custom build destination, set `SITE_BUILD_DIR` to that directory.
These checks exercise input, reader navigation, search, IME protection, and
focus restoration in a simulated DOM; they do not validate browser layout.

Search, navigation, and close buttons provide touch alternatives. Reader
content comes from the same portfolio files as `cat`; no local files are read.

## Tank arcade

Type `tank`, select it in `help`, or visit `/?play=tank` to launch the
canvas game. WASD/arrows move, Space/J fires, P pauses, and Escape closes
the game and returns to the terminal. Mobile direction/fire controls support
press-and-hold. Defend the base against 18 tanks with three lives. Bricks
break; steel blocks shots. The best score is stored only in this browser.
Switching tabs or losing window focus pauses the game.

Simulation and rendering are separate in `assets/js/tank-engine.js` and
`assets/js/tank-game.js`. Run deterministic collision and lifecycle checks:

```sh
node --test tests/tank-engine.test.cjs
```

Existing page URLs open their corresponding content automatically.
Publication and presentation records remain in `_data/`; posts remain in
`_posts/`. JavaScript-disabled browsers receive the page content directly.
The standalone slide deck retains its own styling. Building locally does
not publish the website.

## DNA Snake

Run `games` to choose a game, `snake` to open DNA Snake, or visit `/?play=snake`.
The homepage keeps its single Tank shortcut. Snake uses arrows, WASD, HJKL,
touch arrows or swipes; P pauses and Escape exits. Focus returns to the terminal.
The A/T/C/G sequence grows with each pickup; speed increases every five pickups.
Best scores stay in browser-local storage. This is an arcade game, not a biological simulation.

The seeded simulation is independent of rendering and is tested with:

```sh
node --test tests/snake-engine.test.cjs
```

## Research workflow slides

`assets/slides/ai-workflow-slides.html` is a self-contained 20-slide presentation.
It follows the terminal phosphor preference, includes sources and speaker notes,
and supports j/k or arrows, gg/G, `/` for a searchable contents menu, `n` for
notes, and `f` for fullscreen where supported. The Print button uses a separate
print layout. Named slide links are stable; legacy Reveal-style numeric hashes
still open the corresponding index. This deck presents proposed research
practices and links to vendor documentation, without claiming institutional
approval for a specific tool.

DOM behavior checks use the same jsdom setup as the terminal tests:

```sh
NODE_PATH=/tmp/yw-terminal-tests/node_modules node --test tests/slides.test.cjs
```

## License

This project is licensed under [Creative Commons Zero v1.0 Universal](https://github.com/yaoyao-liu/minimal-light/blob/master/LICENSE).

## Acknowledgements

- Based on [minimal-light](https://github.com/yaoyao-liu/minimal-light) by [Yaoyao Liu](https://github.com/yaoyao-liu)

---

## Public guestbook

Run `guestbook`, visit `/guestbook.html`, or use `/#guestbook`.
One fixed GitHub Discussion stores all messages; the public identifiers are in
`_config.yml`. The homepage remains empty and loads no guestbook service until
opened. GitHub sign-in is required to post. Moderation happens in the repository's
Discussions area. The website holds no posting token and does not store messages.

Embedded comments require the [giscus GitHub app](https://github.com/apps/giscus)
to be installed for `yxwyx/yxwyx.github.io`. The guestbook checks availability on
opening; after installation, refresh or use Retry loading comments. It always
provides a direct GitHub link when embedding is unavailable. No fake comments or
local-only submission forms are used.
