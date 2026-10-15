<p align="right"><a href="README.md">English</a> / <strong>日本語</strong></p>

<h1 align="center">💻 Work Utils Chrome Extension</h1>

<p align="center"><strong>本番環境のタブをひと目で見分け、画面共有中はどのページにも書き込める</strong></p>

Work Utils は plain JavaScript で書いた Manifest V3 の Chrome 拡張機能である。ビルドは不要で、リポジトリのディレクトリがそのまま拡張機能になる。

## ✨ Features

- **Environment colors** — 環境に一致したページには、色付きのバーかウィンドウを囲む枠、環境名のラベルが出て、タブのタイトルの前にも環境名が付く。開発環境は細いバー、本番環境は太い枠にしておけば、危ないタブほど目立つ
- **どのサイトでも使えるルール** — ルールは URL、query parameter、meta タグ、cookie、要素のいずれかから値を読み、パターンと照合する。Google Cloud の project と AWS の account にはプリセットがあり、自分たちのステージング環境のサイトにも同じルールが使える
- **リロードせずにコンソールに追従する** — コンソールで project や account を切り替えると、1 秒以内に色が変わる
- **Draw** — ショートカットひとつで、どのページの上にもペン、線、四角、丸を描ける。画面共有中にページを離れずに指し示せる
- **Highlight** — 選んだテキストにコンテキストメニューから 4 色のハイライトを付けられる。ページの内容は書き換えない

## 🚀 Quick Start

**前提**：デスクトップ版の Chrome

1. このリポジトリを clone する

   ```bash
   git clone https://github.com/amaya382/chrome-work-utils.git
   ```

2. `chrome://extensions/` を開く
3. 「デベロッパー モード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」を押し、clone したディレクトリを選ぶ

ツールバーの拡張機能アイコンを押し、Environment colors の Edit rules を選ぶと設定ページが開く。「Google Cloud project」を選んで「Add rule」を押し、Name に `prod`、Pattern に `*-prod` を入れ、Red を選んで Style を Frame にする。Google Cloud コンソールで ID が `-prod` で終わる project を開くと、ページの周りに赤い枠と `prod` のラベルが出る。

更新するときは `git pull` を実行し、`chrome://extensions/` の拡張機能のカードにある再読み込みボタンを押す。

## 🔒 Permissions

- `storage`：ルールと描画の選択を保存する
- `contextMenus`：選んだテキストのコンテキストメニューに Highlight を加える
- すべてのサイトへのアクセス：どのサイトでもルールの値を読んでページを色付けする

## 🔧 Troubleshooting

### AWS のプリセットが一致しない

AWS のプリセットは AWS コンソールがページに置く値を読むので、AWS 側の変更で読めなくなることがある。コンソールで DevTools を開き、Elements パネルで `<meta name="awsc-session-data">` を、Application パネルで cookie `aws-userInfo` を探して、見つかった形に合わせてルールの Source を直す。account alias のプリセットは、alias を設定した account でだけ一致する。

### 一部のページで何も出ない

Chrome は `chrome://` のページと Chrome Web Store では拡張機能を動かさない。拡張機能のインストールや再読み込みより前に開いていたページは、再読み込みが必要になる。

### 描いたものがスクロールに追従しない

描いたものはウィンドウのスクロールに追従する。多くのクラウドコンソールのように、ウィンドウではなくページ内の要素がスクロールするページでは、描いたものは画面上の同じ位置に留まる。

## 🧪 Development

テストは Node.js 18 以降で実行する。

```bash
node --test
```

編集したら `chrome://extensions/` の拡張機能のカードにある再読み込みボタンを押し、確かめるページを再読み込みする。
