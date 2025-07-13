# DreamScope - 夢を記録して、AIが深層心理を解析する夢日記アプリ

## 🌙 Demo
[**Live Demo**](https://satory074.github.io/dreamscope/) - すぐに体験できます！

## コアコンセプト

DreamScopeは、あなたの夢を記録し、AIが深層心理を分析する夢日記ウェブアプリケーションです。プライバシーファーストの設計で、すべてのデータはブラウザのLocalStorageに保存されます。

### 主な特徴

1. **🧠 AI深層心理分析** - Google Gemini APIが夢の象徴を抽出し、心理学的観点から解釈
2. **🎨 美しいダークモードUI** - 8種類のカラーテーマから選択可能
3. **📝 シンプルな夢の記録** - フリーテキスト形式で簡単に記録
4. **🔒 完全プライバシー保護** - データは100%ローカル保存（AI解析時のみAPI通信）
5. **📊 ストレージ容量監視** - LocalStorageの使用状況を可視化

## 技術スタック

- **フロントエンド**: Vanilla JavaScript, HTML5, CSS3（ビルドプロセスなし）
- **バックエンド**: Node.js + Express.js
- **AI統合**: Google Gemini API（サーバーサイド実装）
- **データストレージ**: ブラウザのLocalStorage（5-10MB制限）
- **開発ツール**: nodemon（開発時の自動リロード）

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/dreamscope.git
cd dreamscope
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
```bash
# .envファイルを作成するか、環境変数を設定
export GEMINI_API_KEY="your-gemini-api-key"
```

### 4. 起動方法

#### AI機能ありで起動（推奨）
```bash
# 本番モード
npm start

# 開発モード（ファイル変更時に自動リロード）
npm run dev
```
http://localhost:3000 でアクセス

#### フロントエンドのみ（AI機能なし）
```bash
# Python使用
python -m http.server 8000

# または Node.js使用
npx http-server -p 8000
```
http://localhost:8000 でアクセス

## 主な機能

### 🌙 夢の記録・管理
- フリーテキスト形式での夢の記録
- 夢の履歴表示と管理
- リアルタイムの入力検証

### 🧠 AI分析機能
- **夢の象徴抽出**: 夢から重要な象徴を自動抽出
- **深層心理分析**: 抽出された象徴の心理学的意味を解釈
- **わかりやすい日本語**: 専門用語を避けた親しみやすい分析結果
- **Bentoグリッドレイアウト**: 分析結果を見やすく表示

### 🎨 カスタマイズ
- 8種類のカラーテーマ（デフォルト、ミッドナイト、オーシャン、フォレスト、サンセット、ラベンダー、ローズ、モノクローム）
- ダークモードベースの目に優しいデザイン
- レスポンシブ対応

### 💾 データ管理
- 完全ローカル保存（プライバシー保護）
- データのバックアップ・復元機能
- ストレージ容量の監視と警告
- JSONフォーマットでのエクスポート

## 必要なもの

- Node.js 14.0以上
- モダンなWebブラウザ（Chrome, Firefox, Safari, Edge）
- Google Gemini API キー（AI機能を使用する場合）

## API エンドポイント

- `POST /api/analyze-dream` - 夢全体の分析
- `POST /api/extract-symbols` - 夢から象徴を抽出
- `POST /api/analyze-symbols` - 抽出された象徴の意味を分析

## プロジェクト構造

```
dreamscope/
├── index.html          # メインのSPAファイル
├── app.js             # アプリケーションロジック
├── server.js          # Express サーバー（Gemini API統合）
├── styles.css         # メインスタイルシート
├── color-palettes.css # カラーテーマ定義
├── js/
│   └── utils.js       # ユーティリティ関数
├── archive/           # アーカイブされたファイル
└── ドキュメント/       # 企画書、機能一覧など
```

## 開発のヒント

- ビルドプロセスなし - ファイルを直接編集
- ブラウザの開発者ツールでLocalStorageを確認: `JSON.parse(localStorage.getItem('dreamscope_dreams'))`
- テストフレームワークは未実装 - ブラウザで手動テスト

## プライバシー

すべての夢のデータはあなたのブラウザのLocalStorageに保存されます。外部サーバーには一切保存されません。AI解析時のみ、夢のテキストがGoogle Gemini APIに送信されますが、解析後は保存されません。

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！バグ報告や機能提案はIssuesでお願いします。