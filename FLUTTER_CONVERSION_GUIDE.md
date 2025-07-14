# Flutter Conversion Guide

このドキュメントは、DreamScope HTMLモックサイトをFlutterアプリケーションに変換するためのガイドです。

## プロジェクト構造

### 現在のHTML/CSS/JS構造
```
dreamscope/
├── index.html              # メインHTML（Flutter: main.dart）
├── app.js                  # アプリケーションロジック
├── flutter-mock.js         # FlutterのWidget構造を模倣
├── flutter-animations.js   # アニメーション実装
├── styles.css              # 基本スタイル
├── color-palettes.css      # テーマシステム
├── flutter-layout.css      # Flutterレイアウト模倣
├── flutter-components.css  # Material Designコンポーネント
└── flutter-animations.css  # アニメーションスタイル
```

### 推奨されるFlutter構造
```
lib/
├── main.dart                    # アプリケーションエントリポイント
├── app.dart                     # MaterialApp設定
├── models/
│   ├── dream.dart              # Dreamモデル
│   └── settings.dart           # Settingsモデル
├── providers/
│   ├── dreams_provider.dart    # 夢の状態管理
│   ├── theme_provider.dart     # テーマ状態管理
│   └── settings_provider.dart  # 設定状態管理
├── views/
│   ├── input_view.dart         # 夢入力画面
│   ├── history_view.dart       # 履歴画面
│   ├── analysis_view.dart      # 分析画面
│   └── settings_view.dart      # 設定画面
├── widgets/
│   ├── dream_card.dart         # 夢カードWidget
│   ├── analysis_card.dart      # 分析カードWidget
│   ├── bottom_navigation.dart  # ボトムナビゲーション
│   └── custom_app_bar.dart     # カスタムAppBar
├── services/
│   ├── api_service.dart        # API通信
│   └── storage_service.dart    # ローカルストレージ
├── theme/
│   ├── app_theme.dart          # テーマ定義
│   └── color_schemes.dart      # カラースキーム
└── utils/
    ├── constants.dart          # 定数
    └── helpers.dart            # ヘルパー関数
```

## Widget マッピング

### HTML要素 → Flutter Widget

| HTML要素 | CSS クラス | Flutter Widget |
|---------|-----------|----------------|
| `<div id="app">` | - | `MaterialApp` |
| `<header>` | `.header` | `AppBar` |
| `<main>` | `.main-content` | `Scaffold.body` |
| `<section>` | `.view` | `StatefulWidget` |
| `<div>` | `.container` | `Container` |
| `<button>` | `.flutter-elevated-button` | `ElevatedButton` |
| `<textarea>` | `.flutter-text-field` | `TextFormField` |
| `<div>` | `.flutter-card` | `Card` |
| `<div>` | `.flutter-row` | `Row` |
| `<div>` | `.flutter-column` | `Column` |
| `<div>` | `.flutter-grid` | `GridView` |

### JavaScript → Dart 変換例

#### 状態管理
```javascript
// JavaScript (現在)
const app = {
    dreams: [],
    currentDream: null,
    settings: { theme: 'default' }
};
```

```dart
// Dart (Flutter)
class DreamsNotifier extends StateNotifier<List<Dream>> {
  DreamsNotifier() : super([]);
  
  void addDream(Dream dream) {
    state = [...state, dream];
  }
}

final dreamsProvider = StateNotifierProvider<DreamsNotifier, List<Dream>>(
  (ref) => DreamsNotifier(),
);
```

#### API通信
```javascript
// JavaScript (現在)
fetch('/api/analyze-dream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: dreamText })
});
```

```dart
// Dart (Flutter)
class ApiService {
  final Dio _dio = Dio();
  
  Future<AnalysisResult> analyzeDream(String content) async {
    final response = await _dio.post(
      '/api/analyze-dream',
      data: {'content': content},
    );
    return AnalysisResult.fromJson(response.data);
  }
}
```

## CSS → Flutter Theme 変換

### カラーパレット
```css
/* CSS (現在) */
:root {
    --primary-color: #5a4fcf;
    --secondary-color: #ff6b6b;
}
```

```dart
// Dart (Flutter)
class AppTheme {
  static ThemeData defaultTheme = ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: Color(0xFF5A4FCF),
      secondary: Color(0xFFFF6B6B),
    ),
  );
}
```

### レイアウト
```css
/* CSS Flexbox */
.flutter-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
```

```dart
// Flutter
Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: [
    // widgets
  ],
)
```

## アニメーション変換

### CSS Animation → Flutter Animation
```css
/* CSS */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

```dart
// Flutter
class FadeInAnimation extends StatefulWidget {
  @override
  _FadeInAnimationState createState() => _FadeInAnimationState();
}

class _FadeInAnimationState extends State<FadeInAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 300),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(_controller);
    _controller.forward();
  }
}
```

## 依存パッケージ

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.0.0      # 状態管理
  dio: ^5.0.0                   # HTTP通信
  shared_preferences: ^2.0.0    # ローカルストレージ
  intl: ^0.18.0                # 日付フォーマット
  flutter_svg: ^2.0.0          # SVGアイコン
  animations: ^2.0.0           # アニメーション
```

## 変換手順

1. **プロジェクト作成**
   ```bash
   flutter create dreamscope_app
   cd dreamscope_app
   ```

2. **依存関係追加**
   ```bash
   flutter pub add flutter_riverpod dio shared_preferences
   ```

3. **モデル作成**
   - `Dream`, `Settings` などのデータモデルを作成

4. **プロバイダー設定**
   - Riverpodを使用して状態管理を実装

5. **UI実装**
   - HTML構造に基づいてWidgetツリーを構築
   - CSS クラスに対応するFlutter Widgetを使用

6. **テーマ実装**
   - CSS変数をFlutter ThemeDataに変換

7. **アニメーション実装**
   - CSS アニメーションをFlutter AnimationControllerで再現

8. **API統合**
   - fetch APIをDioに置き換え

9. **ストレージ実装**
   - localStorageをshared_preferencesに置き換え

## 注意事項

- **レスポンシブ対応**: `MediaQuery`を使用して異なる画面サイズに対応
- **プラットフォーム固有**: iOS/Android固有の調整が必要な場合は`Platform`クラスを使用
- **パフォーマンス**: `ListView.builder`を使用して大量のデータを効率的に表示
- **アクセシビリティ**: `Semantics`ウィジェットを使用してアクセシビリティを確保

## デバッグとテスト

```dart
// デバッグ用ログ
debugPrint('Current state: ${ref.read(dreamsProvider)}');

// ウィジェットテスト
testWidgets('Dream input test', (WidgetTester tester) async {
  await tester.pumpWidget(MyApp());
  await tester.enterText(find.byType(TextFormField), 'Test dream');
  await tester.tap(find.byType(ElevatedButton));
  await tester.pump();
  
  expect(find.text('Test dream'), findsOneWidget);
});
```

このガイドに従って、HTMLモックサイトからFlutterアプリケーションへの変換を進めてください。