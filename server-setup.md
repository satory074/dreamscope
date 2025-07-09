# DreamScope サーバーセットアップ

## 概要
DreamScopeアプリケーションのAI機能をサーバー側で処理するための設定です。

## セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
Gemini APIキーを環境変数として設定します：

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

または、`.env`ファイルを作成：
```
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. サーバーの起動
```bash
# 本番環境
npm start

# 開発環境（自動リロード）
npm run dev
```

デフォルトでポート3000で起動します。

## APIエンドポイント

### POST /api/analyze-dream
夢の内容を分析します。

リクエストボディ：
```json
{
  "dreamContent": "夢の内容",
  "systemPrompt": "システムプロンプト",
  "prompt": "プロンプト"
}
```

## 注意事項
- APIキーは環境変数で管理し、コードに直接記載しないでください
- CORSが有効になっているため、任意のオリジンからアクセス可能です（本番環境では適切に制限してください）