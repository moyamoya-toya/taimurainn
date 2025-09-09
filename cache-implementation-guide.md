# キャッシュ機能付き推理小説タイムテーブル - 実装ガイド

## 新機能の説明

### 1. 自動保存機能
- **データの自動保存**: 登場人物の追加・削除、時間行の追加・削除、セルの編集時に自動的に保存
- **最終保存時刻表示**: ヘッダーに「最終保存: [時刻]」が表示
- **ブラウザ再起動対応**: ブラウザを閉じて再度開いても、前回の状態を復元

### 2. リセット機能  
- **リセットボタン**: 全データを初期状態に戻すボタンを追加
- **確認ダイアログ**: 誤操作を防ぐため、削除前に確認モーダルを表示
- **完全初期化**: 登場人物、時間行、セル内容をすべて初期状態に戻す

## GitHubに公開する際の修正点

**注意**: 現在のサンドボックス版では、localStorageが使用できないため、in-memoryストレージを使用しています。実際のWebサイトで永続化するには、以下の修正が必要です：

### app.js の修正

```javascript
class DetectiveTimetableStorage {
    constructor() {
        this.storageKey = 'detectiveTimetableData';
        this.defaultData = {
            characters: ["登場人物A", "登場人物B", "登場人物C"],
            timeRows: ["08:00", "09:00", "10:00", "11:00", "12:00"],
            cellData: {},
            lastSaved: null
        };
    }

    // localStorage を使用した保存
    saveData(data) {
        try {
            const saveData = {
                ...data,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('保存に失敗しました:', error);
            return false;
        }
    }

    // localStorage からのデータ読み込み
    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
            return this.defaultData;
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return this.defaultData;
        }
    }

    // localStorage のクリア
    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('データの削除に失敗しました:', error);
            return false;
        }
    }
}
```

## ファイル構成（GitHub公開用）

```
detective-novel-timetable/
├── index.html                 # メインページ
├── css/
│   └── style.css             # スタイルシート
├── js/
│   └── app.js                # JavaScript（上記修正版）
├── README.md                 # プロジェクト説明
├── .gitignore                # Git除外設定
└── docs/
    └── screenshots/          # スクリーンショット
```

## 使用方法

### 自動保存の動作
1. 登場人物名を変更 → 自動保存
2. 登場人物を追加・削除 → 自動保存
3. 時間行を追加・削除 → 自動保存
4. テーブルセルに内容を入力 → 自動保存
5. ヘッダーの「最終保存」時刻が更新される

### リセット機能の使用
1. 「リセット」ボタンをクリック
2. 確認モーダルで「削除する」を選択
3. 全データが初期状態に戻る
4. localStorageもクリアされる

## 技術仕様

### 保存データ形式
```javascript
{
  "characters": ["登場人物A", "登場人物B"],
  "timeRows": ["08:00", "09:00", "10:00"],
  "cellData": {
    "row-0-col-0": "セルの内容",
    "row-1-col-1": "別の内容"
  },
  "lastSaved": "2024-01-01T12:00:00.000Z"
}
```

### 対応ブラウザ
- Chrome/Edge (推奨)
- Firefox
- Safari
- localStorageをサポートする全てのモダンブラウザ

### エラーハンドリング
- localStorage が使用できない場合、in-memoryに自動フォールバック
- データ破損時は初期状態にリセット
- 保存失敗時はコンソールにエラーログを出力

## デプロイメント

### GitHub Pages での公開
1. GitHubリポジトリにpush
2. Settings → Pages で設定
3. `https://username.github.io/detective-novel-timetable/` でアクセス可能

### 注意事項
- データはブラウザのlocalStorageに保存されるため、ブラウザを変えるとデータは引き継がれません
- ブラウザのプライベートモードでは保存されない場合があります
- データのバックアップ機能は今回は含まれていません（将来の拡張として検討可能）