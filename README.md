<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">🛠️ Development Utils</h1>

<p align="center">
  <strong>Utilities for developers in Chrome.</strong><br/>
  Environment colors marks the environment a page belongs to, such as a Google Cloud project or an AWS account.<br/>
  Draw and Highlight mark up a page while you explain it, such as during a screen share.
</p>

Development Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## Why Development Utils?

- **Shows the environment at a glance** — a page that matches a rule gets a colored bar or a frame around the whole window, a label with the environment's name, and the name in front of the tab title. Choose a thin bar for development and a thick frame for production, so the dangerous tab is the loud one
- **Works the same on any site** — a rule reads a value from the page's URL, a query parameter, a meta tag, a cookie, or an element, and compares it with a pattern. Google Cloud and AWS are presets of these rules, so a rule can be fixed on the settings page when a console changes, and the same rules work for your own staging sites
- **Follows the console without a reload** — switching the project or account in a console changes the color within a second
- **Points at things while you explain** — draw pens, lines, rectangles, and circles over any page, and highlight text from the context menu, without leaving the page

## 🚀 Quick Start

**Requirements:** desktop Chrome.

1. Clone this repository

   ```bash
   git clone https://github.com/amaya382/chrome-development-utils.git
   ```

2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the cloned directory

Click the extension's icon in the toolbar to open the settings page. Choose "Google Cloud project" and click "Add rule", then enter `prod` as Name and `*-prod` as Pattern, pick Red, and set Style to Frame. Open a project whose ID ends with `-prod` in the Google Cloud console, and a red frame with the label `prod` appears around the page.

To update, run `git pull` and click the reload button on the extension's card in `chrome://extensions/`.

## 📖 Usage

### Environment colors

Rules are edited on the settings page, which opens from the extension's icon. Changes are saved as they are typed and apply to open tabs right away. Rules are synced with your Chrome profile.

Each rule has these fields:

| Field | Meaning |
| --- | --- |
| Name | Shown on the label and in front of the tab title, such as `[prod] Compute Engine` |
| Color | One of eight preset colors, or any color from the custom swatch |
| Style | Bar: a thin bar at the top of the window. Frame: a thick border around the window |
| Site | The pages the rule applies to, compared with the page's URL |
| Source | Where the value is read from |
| Pattern | The value that selects this environment |

Site and Pattern use `*` as a wildcard for any characters, must match the whole value, and ignore case. For example, `*-prod` matches `shop-prod` but not `shop-prod-2`, and `https://*console.aws.amazon.com/*` matches every regional AWS console.

The source types are:

| Source | Value |
| --- | --- |
| URL | The page's whole URL |
| URL query | The value of the query parameter Name, such as `project` in `?project=shop-prod` |
| Meta tag | The `content` of `<meta name="Name">` |
| Cookie | The value of the cookie Name, decoded from URL encoding |
| Element text | The text of the first element that matches Selector, with surrounding spaces removed |

For Meta tag and Cookie, JSON key reads one property of a JSON value, and a dotted key such as `user.alias` reads a nested property. Leave it empty to use the whole value.

The presets fill in Site and Source when a rule is added, and every field can be edited afterwards:

| Preset | Site | Source |
| --- | --- | --- |
| Google Cloud project | `https://console.cloud.google.com/*` | URL query `project` |
| AWS account ID | `https://*console.aws.amazon.com/*` | Meta tag `awsc-session-data`, JSON key `accountId` |
| AWS account alias | `https://*console.aws.amazon.com/*` | Cookie `aws-userInfo`, JSON key `alias` |
| URL | `*` | URL |

Rules are checked from top to bottom, and the first rule that matches colors the page. Put specific rules above general ones, such as `*-prod` above `*`. The arrow buttons on a rule move it up and down.

The label sits at the top center of the window, over the page's header. It turns transparent while the pointer is on it, and the bar, the frame, and the label never take clicks. The label's text is black or white, whichever reads better on the chosen color.

The extension checks the page again every second, so it follows a console that changes the project or account without loading a new page.

### Draw

Press `Alt+Shift+D` to start drawing on the current tab. The same shortcut stops drawing. The shortcut can be changed at `chrome://extensions/shortcuts`.

A toolbar appears on the page. Drag its grip on the left to move it; it reopens at the same place.

| Tool | Drawing |
| --- | --- |
| Pen | A freehand line |
| Line | A straight line from where the drag starts to where it ends |
| Rectangle | A rectangle spanning the drag |
| Circle | An ellipse that fits in the drag |
| Eraser | Erases what it passes over |

The second row of the toolbar has the choices for the current tool. Pen, Line, Rectangle, and Circle have a color, a width, and an opacity. Rectangle and Circle also have Fill, which is none or one of the colors, drawn with the same opacity. Eraser has only a width. Each tool remembers its own choices, and they are kept after the browser restarts.

| Button | Action |
| --- | --- |
| Undo, Redo | Undo or redo the last drawing or Clear. `Ctrl+Z`, `Ctrl+Shift+Z`, and `Ctrl+Y` work too |
| Clear | Erase everything |
| Hide drawings | Hide the drawings without erasing them. Drawing again shows them |
| Pin | Keep the drawings where they are on the screen while the page scrolls. Turn it off and they scroll with the page again from where they are |
| Stop drawing | Hide the toolbar and give the page back the pointer. `Esc` does the same |

The drawings scroll with the page by default, and stay on the page after drawing stops so you can click and scroll the page while they are shown. They disappear when the page is reloaded or another page is opened.

### Highlight

Select text, right-click it, and choose Development Utils → Highlight yellow, green, blue, or pink. Remove highlight removes the highlights that overlap the selected text, and Clear highlights removes all of them on the page.

Highlights do not change the page's content, and they disappear when the page is reloaded.

## 🔒 Permissions

- `storage` — save the rules and the drawing choices
- `contextMenus` — add Highlight to the context menu of selected text
- Access to all sites — read the value of a rule and color the page on any site

## 🔧 Troubleshooting

### An AWS preset does not match

The AWS presets read values that the AWS console puts in the page, and AWS can change them. Open DevTools on the console and look for `<meta name="awsc-session-data">` in the Elements panel, or the `aws-userInfo` cookie in the Application panel, then change the rule's Source to what is there. The account alias preset matches only on accounts that have an alias set.

### Nothing appears on some pages

Chrome does not run extensions on `chrome://` pages or the Chrome Web Store. A page that was open before the extension was installed or reloaded needs a reload.

### Drawings do not follow the scroll

The drawings follow the scroll of the window. On a page that scrolls an element inside it instead, such as many cloud consoles, the drawings stay where they are on the screen.

## 🧪 Development

| File | Role |
| --- | --- |
| `manifest.json` | Extension manifest |
| `core.js` | Colors, presets, value sources, and rule matching. Shared by the content script, the settings page, and the tests |
| `content.js` | Reads the page, draws the bar, frame, and label, and sets the tab title |
| `annotation.js` | Drawing tools and their choices, highlight colors, undo history, and pinning. Shared by the content scripts, the background, and the tests |
| `draw.js` | The drawing layer and its toolbar |
| `highlight.js` | Highlights selected text |
| `options.html`, `options.css`, `options.js` | The settings page |
| `background.js` | Opens the settings page from the toolbar icon, adds the context menu, and passes it and the shortcut to the page |
| `icons/` | Extension icons |
| `test/` | Unit tests for `core.js` and `annotation.js` |

Run the tests with Node.js 18 or later:

```bash
node --test
```

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.
