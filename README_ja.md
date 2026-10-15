<p align="right"><a href="README.md">English</a> / <strong>日本語</strong></p>

<h1 align="center">🛠️ Development Utils</h1>

<p align="center">
  <strong>Chrome で使う開発者向けのユーティリティ</strong><br/>
  Environment colors は、Google Cloud の project や AWS の account など、ページがどの環境のものかを色で示す。<br/>
  Draw と Highlight は、画面共有中の説明などでページに書き込みや印を付ける。
</p>

Development Utils は plain JavaScript で書いた Manifest V3 の Chrome 拡張機能である。ビルドは不要で、リポジトリのディレクトリがそのまま拡張機能になる。

## Why Development Utils?

- **環境がひと目でわかる** — ルールに一致したページには、色付きのバーかウィンドウ全体を囲む枠、環境名のラベルが出て、タブのタイトルの前にも環境名が付く。開発環境は細いバー、本番環境は太い枠にしておけば、危ないタブほど目立つ
- **どのサイトでも同じ仕組みで動く** — ルールはページの URL、query parameter、meta タグ、cookie、要素のいずれかから値を読み、パターンと照合する。Google Cloud と AWS はこのルールのプリセットなので、コンソール側が変わっても設定ページでルールを直せる。自分たちのステージング環境のサイトにも同じルールが使える
- **リロードせずにコンソールに追従する** — コンソールで project や account を切り替えると、1 秒以内に色が変わる
- **説明しながら指し示せる** — どのページの上にもペン、線、四角、丸を描け、コンテキストメニューからテキストにハイライトを付けられる。ページを離れる必要はない

## 🚀 Quick Start

**前提**：デスクトップ版の Chrome

1. このリポジトリを clone する

   ```bash
   git clone https://github.com/amaya382/chrome-development-utils.git
   ```

2. `chrome://extensions/` を開く
3. 「デベロッパー モード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」を押し、clone したディレクトリを選ぶ

ツールバーの拡張機能アイコンを押し、Environment colors の Edit rules を選ぶと設定ページが開く。「Google Cloud project」を選んで「Add rule」を押し、Name に `prod`、Pattern に `*-prod` を入れ、Red を選んで Style を Frame にする。Google Cloud コンソールで ID が `-prod` で終わる project を開くと、ページの周りに赤い枠と `prod` のラベルが出る。

更新するときは `git pull` を実行し、`chrome://extensions/` の拡張機能のカードにある再読み込みボタンを押す。

## 📖 Usage

### Environment colors

ルールは拡張機能のポップアップの Edit rules から開く設定ページで編集する。ポップアップには今のタブの環境も出る。入力した内容はその場で保存され、開いているタブにもすぐ反映される。ルールは Chrome のプロファイルで同期される。

ルールの項目は次のとおり。

| 項目 | 意味 |
| --- | --- |
| Name | ラベルとタブのタイトルの前に出る名前。例: `[prod] Compute Engine` |
| Color | 8 色のプリセットか、カスタムのスウォッチで選んだ任意の色 |
| Style | Bar はウィンドウ上端の細いバー、Frame はウィンドウを囲む太い枠 |
| Site | ルールを適用するページ。ページの URL と照合する |
| Source | 値を読む場所 |
| Pattern | この環境を選ぶ値 |

Site と Pattern では `*` が任意の文字列を表す。照合は値全体に対して行い、大文字と小文字は区別しない。たとえば `*-prod` は `shop-prod` に一致するが `shop-prod-2` には一致しない。`https://*console.aws.amazon.com/*` はリージョンごとの AWS コンソールすべてに一致する。

Source の種類は次のとおり。

| Source | 値 |
| --- | --- |
| URL | ページの URL 全体 |
| URL query | query parameter Name の値。例: `?project=shop-prod` の `project` |
| Meta tag | `<meta name="Name">` の `content` |
| Cookie | cookie Name の値を URL デコードしたもの |
| Element text | Selector に一致する最初の要素のテキストから前後の空白を除いたもの |

Meta tag と Cookie では、JSON key を指定すると値を JSON として読んでそのプロパティを取り出す。`user.alias` のようにドットでつなぐと入れ子のプロパティを読む。空にすると値全体を使う。

プリセットはルールを追加するときに Site と Source を埋める。どの項目もあとから編集できる。

| プリセット | Site | Source |
| --- | --- | --- |
| Google Cloud project | `https://console.cloud.google.com/*` | URL query `project` |
| AWS account ID | `https://*console.aws.amazon.com/*` | Meta tag `awsc-session-data`、JSON key `accountId` |
| AWS account alias | `https://*console.aws.amazon.com/*` | Cookie `aws-userInfo`、JSON key `alias` |
| URL | `*` | URL |

ルールは上から順に照合し、最初に一致したルールでページを色付けする。`*-prod` を `*` より上に置くように、具体的なルールを一般的なルールより上に置く。ルールの矢印ボタンで順番を入れ替えられる。

ラベルはウィンドウ上端の中央、ページのヘッダーの上に出る。ポインターを重ねている間は透明になり、バーと枠とラベルはクリックを受け取らない。ラベルの文字色は、選んだ色の上で読みやすい方の黒か白になる。

拡張機能は 1 秒ごとにページを判定し直すので、新しいページを読み込まずに project や account を切り替えるコンソールにも追従する。

### Draw

`Alt+Shift+D` を押すか、拡張機能のアイコンを押して Start drawing を選ぶと、今のタブで描画を始める。同じショートカットで描画を終える。ショートカットは `chrome://extensions/shortcuts` で変えられる。

ページ上にツールバーが出る。左端のつまみをドラッグすると動かせ、次に開いたときも同じ位置に出る。

| ツール | 描くもの |
| --- | --- |
| Pen | フリーハンドの線 |
| Line | ドラッグの始点から終点までの直線 |
| Rectangle | ドラッグした範囲の四角 |
| Circle | ドラッグした範囲に収まる楕円 |
| Eraser | なぞったところを消す |

ツールバーの 2 段目に、選んでいるツールの選択肢が出る。Pen、Line、Rectangle、Circle では色、太さ、透明度を選べる。Rectangle と Circle ではさらに Fill として、塗りなしか色のどれかを選べ、塗りは線と同じ透明度で描く。Eraser では太さだけを選べる。選択はツールごとに記憶され、ブラウザーを再起動しても残る。

| ボタン | 動作 |
| --- | --- |
| Undo、Redo | 直前の描画や Clear を取り消す、またはやり直す。`Ctrl+Z`、`Ctrl+Shift+Z`、`Ctrl+Y` でも操作できる |
| Clear | すべて消す |
| Hide drawings | 消さずに描いたものを隠す。もう一度描くと表示に戻る |
| Pin | ページをスクロールしても描いたものを画面上の同じ位置に留める。オフに戻すと、その位置からまたページと一緒にスクロールする |
| Stop drawing | ツールバーを隠し、ポインターの操作をページに戻す。`Esc` でも同じ |

描いたものは既定ではページと一緒にスクロールする。描画を終えてもページ上に残るので、表示したままページをクリックしたりスクロールしたりできる。ページを再読み込みするか別のページを開くと消える。

### Highlight

テキストを選んで右クリックし、Development Utils → Highlight yellow、green、blue、pink のどれかを選ぶ。Remove highlight は選んだテキストに重なるハイライトを消し、Clear highlights はページのハイライトをすべて消す。Clear highlights は拡張機能のポップアップにもある。

ハイライトはページの内容を書き換えず、ページを再読み込みすると消える。

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

| ファイル | 役割 |
| --- | --- |
| `manifest.json` | 拡張機能のマニフェスト |
| `core.js` | 色、プリセット、値の読み取り、ルールの照合。content script、設定ページ、テストで共有する |
| `content.js` | ページを読み、バー、枠、ラベルを描き、タブのタイトルを設定する |
| `annotation.js` | 描画ツールとその選択肢、ハイライトの色、undo の履歴、pin。content script、background、テストで共有する |
| `draw.js` | 描画レイヤーとツールバー |
| `highlight.js` | 選んだテキストにハイライトを付ける |
| `popup.html`、`popup.css`、`popup.js` | ツールバーアイコンのポップアップ |
| `options.html`、`options.css`、`options.js` | 設定ページ |
| `background.js` | コンテキストメニューを加え、メニューとショートカットの操作をページに渡す |
| `icons/` | 拡張機能のアイコン |
| `test/` | `core.js` と `annotation.js` の unit test |

テストは Node.js 18 以降で実行する。

```bash
node --test
```

編集したら `chrome://extensions/` の拡張機能のカードにある再読み込みボタンを押し、確かめるページを再読み込みする。
