# The Archive — personal site

A static site: 12 sections, a card-catalog visual style, three infinite-canvas
pinboards (Cricket, Learning, Questions) with a red-string toggle, and an
on-site editor so you can add or change content without touching code.

No build step. No server. It's plain HTML/CSS/JS, meant for GitHub Pages.

---

## 1. Put it on GitHub Pages

1. Create a new **public** GitHub repository (e.g. `my-archive`).
2. Upload every file in this folder to the repo, keeping the folder structure
   (`css/`, `js/`, `data/`, and the `.html` files all at the top level).
3. In the repo, go to **Settings → Pages**. Under "Build and deployment,"
   set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**.
   Save.
4. GitHub gives you a URL like `https://yourusername.github.io/my-archive/`.
   It can take a minute or two the first time.

## 2. Connect the editor to your repo

Open `js/github-cms.js` and edit the three lines near the top:

```js
const GH_CONFIG = {
  owner:  "YOUR-GITHUB-USERNAME",
  repo:   "YOUR-REPO-NAME",
  branch: "main",
};
```

Replace with your actual GitHub username and repo name, commit, and push.
This tells the on-site editor which repo to save changes to.

## 3. Make yourself a token (this is what makes editing "yours only")

The site is fully static — there's no login system, because GitHub Pages
can't run one. Instead, editing is gated behind a **GitHub personal access
token** that only you generate and only you paste into your own browser.
Nobody viewing the site can edit unless they also have a token with write
access to your repo.

1. On GitHub: **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Give it a name like "archive site editing."
3. Under **Repository access**, choose **Only select repositories** and pick
   this repo — not all your repos.
4. Under **Permissions → Repository permissions**, set **Contents** to
   **Read and write**. Leave everything else as "No access."
5. Generate the token and **copy it immediately** — GitHub only shows it once.

Keep this token private, the same way you'd treat a password. If you ever
paste it somewhere you shouldn't, go back to that token's settings page and
revoke it, then generate a new one.

## 4. Editing content on the live site

1. Visit your site.
2. Click **🔒 view only** in the top right. Paste your token when prompted.
   It becomes **🔓 editing** — this only changes for *your* browser.
3. On any list page (Reading List, Projects, Notes, etc.) a **+ Add** button
   appears. Click it, fill in the form, click **Save**. Hover a card to
   **edit** or **delete** it.
4. On a board page (Cricket, Learning, Questions), click **+ Add pin** to
   drop a new card at the center of your view. Drag a pin to reposition it.
   Click **Connect pins**, then click two pins in a row to string a red line
   between them (click it again to turn connect-mode off). The **pinboard
   strings** button at top shows or hides all the red lines for anyone
   viewing the board.
5. Every save commits directly to your repo. GitHub Pages rebuilds
   automatically — changes usually show up for everyone within about a
   minute. Refresh to check.
6. Click **🔓 editing** again any time to lock the site back to view-only in
   that browser.

If a save ever fails, it's almost always the token — check it's still valid
and still scoped to **Contents: Read and write** on this specific repo.

### Editing by hand instead

Every page's content lives in a plain JSON file in `/data`. You can always
skip the on-site editor and edit those files directly on GitHub.com (or in
any text editor) — for example `data/reading-list.json` holds your reading
list as a JSON array. This is the only option for the **Gallery** page's
images: paste in a URL to an image you've uploaded to the repo's `img/`
folder (e.g. `img/lake-trip.jpg`) or hosted anywhere else, since there's no
image-upload button yet.

## 5. Adding real content

Nothing is pre-filled — every section starts empty on purpose, so nothing
here is guessed on your behalf. Use Edit Mode (or the JSON files directly)
to add your actual reading list, projects, resume entries, and so on.

## 6. Adjusting the look later

- Colors: all named CSS variables at the top of `css/theme.css` (`--bg`,
  `--panel`, `--teal`, `--string-red`, etc.) — change a value there and it
  updates everywhere.
- Fonts: `Courier Prime` (labels, nav, card meta) and `Spectral` (headings,
  body) are loaded from Google Fonts in each page's `<head>`.
- Card style ("index card" look, the little colored tab) is the `.card`
  rules in `css/theme.css`.
- The board/pinboard look is in `css/board.css`.

## How it's structured, if you want to extend it

- `js/list-editor.js` — one reusable "card list" component, used by
  Socials, Resume, Projects, Reading List, Wishlist, Notes, Goals, and
  Gallery. Each page just configures which fields it needs.
- `js/board.js` — one reusable infinite-canvas pinboard component, used by
  Cricket, Learning, and Questions.
- `js/github-cms.js` — the token-gated save/load logic both of the above
  call into.
- To add a 13th list-style page: copy one of the existing list `.html`
  files, add a new empty JSON file in `/data`, and change the `dataPath`,
  `itemLabel`, and `fields` in its script block.
