# 推理小説タイムテーブル - Git プロジェクト構造

## 推奨ディレクトリ構造

```
detective-novel-timetable/
├── README.md
├── LICENSE
├── .gitignore
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── docs/
    ├── screenshots/
    └── usage.md
```

## セットアップ手順

### 1. GitHubリポジトリ作成
```bash
# GitHubでリポジトリを作成後
git clone https://github.com/yourusername/detective-novel-timetable.git
cd detective-novel-timetable
```

### 2. ファイル配置
- `index.html` - ルートディレクトリに配置
- `style.css` - `css/style.css` に配置  
- `app.js` - `js/app.js` に配置

### 3. index.htmlのパス修正
```html
<!-- CSSのパスを修正 -->
<link rel="stylesheet" href="css/style.css">

<!-- JavaScriptのパスを修正 -->
<script src="js/app.js"></script>
```

### 4. README.md作成例
```markdown
# 推理小説タイムテーブル

スタイリッシュな推理小説のタイムライン管理ツール

## 機能
- 登場人物の追加・削除
- 時間行の追加・削除
- 時間間隔設定
- レスポンシブデザイン

## 使用方法
1. `index.html` をブラウザで開く
2. 登場人物を追加
3. 時間を設定してタイムテーブルを作成

## デモ
[GitHub Pages](https://yourusername.github.io/detective-novel-timetable/)

## 技術スタック
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
```

### 5. .gitignore作成
```
# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
```

### 6. GitHub Pages設定
1. GitHubリポジトリの Settings タブ
2. Pages セクション
3. Source: "Deploy from a branch"
4. Branch: "main"
5. Folder: "/ (root)"

## Git コマンド例

```bash
# 初期化とファイル追加
git init
git add .
git commit -m "Initial commit: Detective novel timetable"

# リモートリポジトリ設定
git remote add origin https://github.com/yourusername/detective-novel-timetable.git
git branch -M main
git push -u origin main

# 更新時
git add .
git commit -m "Update: 機能改善"
git push
```

## ライセンス提案
- MIT License (オープンソースとして公開する場合)
- 個人利用のみの制限を加える場合は独自ライセンス

## 注意点
- Google Fonts の CDN を使用しているため、インターネット接続が必要
- モダンブラウザ対応 (IE11非対応)
- レスポンシブデザインでモバイル対応済み