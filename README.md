<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">💻 Work Utils Chrome Extension</h1>

<p align="center"><strong>Spot the production tab at a glance, and draw on any page during a screen share.</strong></p>

Work Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## ✨ Features

- **Environment colors** — pages of a matching environment get a colored bar or a frame around the window, a label with the environment's name, and the name in front of the tab title. Use a thin bar for development and a thick frame for production, so the dangerous tab is the loud one
- **Rules that work on any site** — a rule reads a value from the URL, a query parameter, a meta tag, a cookie, or an element and compares it with a pattern. Presets cover Google Cloud projects and AWS accounts, and the same rules work for your own staging sites
- **Follows the console without a reload** — switching the project or account in a console changes the color within a second
- **Draw** — draw pens, lines, rectangles, and circles over any page with a shortcut, to point at things during a screen share without leaving the page
- **Highlight** — mark selected text in one of four colors from the context menu, without changing the page's content
- **Markdown link** — paste a URL over selected text in a text field or an editor to turn the text into `[text](url)`. Turn it off from the extension's popup

## 🚀 Quick Start

**Requirements:** desktop Chrome.

1. Clone this repository

   ```bash
   git clone https://github.com/amaya382/chrome-work-utils.git
   ```

2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the cloned directory

Click the extension's icon in the toolbar, then Edit rules under Environment colors, to open the settings page. Choose "Google Cloud project" and click "Add rule", then enter `prod` as Name and `*-prod` as Pattern, pick Red, and set Style to Frame. Open a project whose ID ends with `-prod` in the Google Cloud console, and a red frame with the label `prod` appears around the page.

To update, run `git pull` and click the reload button on the extension's card in `chrome://extensions/`.

## 🔒 Permissions

- `storage` — save the rules, the drawing choices, and whether Markdown link is on
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

Run the tests with Node.js 18 or later:

```bash
node --test
```

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.
