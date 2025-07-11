# DreamScope - 夢を記録し、意味づけ、人生のヒントにする

## 🌙 Demo
[**Live Demo**](https://satory074.github.io/dreamscope/) - すぐに体験できます！

## コアコンセプト

DreamScopeは、夢の記憶を**1語からでも記録可能**にし、生成AIがその内容を**心理的・象徴的に解釈**してくれる自己内省アプリです。

### 4つの核心価値

1. **📝 超軽量入力** - 単語だけでも記録OK。AIが自然な文章に補完
2. **🧠 AI深層解釈** - Gemini AIが心理学的観点から夢を分析
3. **📊 視覚的な気づき** - カレンダーやタグクラウドで夢のパターンを発見
4. **🔒 プライバシー重視** - データは完全にローカル保存（AI解析時のみ通信）

> 「朝の3秒で記録 → AIが意味づけ → 1分で気づき」を実現

## 技術スタック

- **フロントエンド**: Vanilla JavaScript, HTML5, CSS3
- **バックエンド**: Node.js + Express.js
- **AI**: Google Gemini API
- **データ保存**: ブラウザのLocalStorage
- **可視化**: D3.js（予定）

## 使い方

### フロントエンドのみ（AI機能なし）
```bash
# Python使用
python -m http.server 8000

# または Node.js使用
npx http-server -p 8000
```
その後 http://localhost:8000 でアクセス

### フルセットアップ（AI機能含む）
```bash
# 依存関係をインストール
npm install

# Gemini API キーを設定
export GEMINI_API_KEY="your-gemini-api-key"

# サーバー起動
npm start
```
その後 http://localhost:3000 でアクセス

## 機能

### 🌙 夢の記録
- **単語入力**: キーワードだけで簡単記録
- **文章入力**: 詳しく記述したい方向け

### 🧠 AI解析
- Gemini AIによる心理学的解釈
- サーバーサイドでAPIキー管理（クライアントにキー不要）

### 📊 データ可視化
- カレンダービューで記録確認
- タグクラウドで傾向分析
- 連続記録日数の追跡

### 📤 共有機能
- 美しいシェア画像を自動生成
- SNSで気づきを共有

### 💾 データ管理
- ローカルストレージで安全保存
- CSV/JSONエクスポート
- バックアップ・復元機能

## 必要なもの

- モダンなWebブラウザ（Chrome, Firefox, Safari, Edge）
- AI機能を使う場合: Gemini API キー（サーバーサイドで設定）

## プライバシー

すべてのデータはあなたのブラウザのローカルストレージに保存されます。外部サーバーには送信されません（AI解析時のみ、夢のテキストがGemini APIに送信されます）。