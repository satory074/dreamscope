/**
 * Flutter Mock JavaScript
 * 
 * このファイルは、HTMLモックサイトをFlutterのWidget構造に
 * 近い形で動作させるためのJavaScriptです。
 * 
 * Flutter変換時の参考となるよう、Flutterの概念を
 * JavaScriptで模倣しています。
 */

// Flutter Widget階層を模倣したクラス構造
class FlutterWidget {
    constructor(element) {
        this.element = element;
        this.widgetType = element.getAttribute('data-flutter-widget');
        this.state = {};
        this.mounted = false;
    }

    // Flutter の initState() を模倣
    initState() {
        this.mounted = true;
        console.log(`${this.widgetType}: initState() called`);
    }

    // Flutter の setState() を模倣
    setState(callback) {
        if (!this.mounted) return;
        
        callback();
        this.build();
        console.log(`${this.widgetType}: setState() called`);
    }

    // Flutter の build() メソッドを模倣
    build() {
        // 各ウィジェットごとにオーバーライド
    }

    // Flutter の dispose() を模倣
    dispose() {
        this.mounted = false;
        console.log(`${this.widgetType}: dispose() called`);
    }
}

// MaterialApp を模倣
class MaterialApp extends FlutterWidget {
    constructor(element) {
        super(element);
        this.theme = this.detectTheme();
    }

    detectTheme() {
        // Flutter の ThemeData を模倣
        const currentTheme = document.body.getAttribute('data-theme') || 'default';
        return {
            brightness: 'light',
            primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
            accentColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color'),
            theme: currentTheme
        };
    }

    // Flutter の Theme.of(context) を模倣
    static of(element) {
        const app = document.querySelector('[data-flutter-widget="MaterialApp"]');
        return new MaterialApp(app).theme;
    }
}

// Scaffold を模倣
class Scaffold extends FlutterWidget {
    constructor(element) {
        super(element);
        this.appBar = element.querySelector('[data-flutter-widget="AppBar"]');
        this.body = element.querySelector('[data-flutter-widget="IndexedStack"]');
        this.bottomNavigationBar = null; // 今回は実装なし
    }

    initState() {
        super.initState();
        // ナビゲーションの初期化
        this.initNavigation();
    }

    initNavigation() {
        // Flutter の BottomNavigationBar を模倣
        const navButtons = this.appBar.querySelectorAll('.nav-btn');
        navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.setState(() => {
                    this.currentIndex = index;
                    this.updateView(btn.getAttribute('data-view'));
                });
            });
        });
    }

    updateView(viewName) {
        // IndexedStack の動作を模倣
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`)?.classList.add('active');
    }
}

// TextFormField を模倣
class TextFormField extends FlutterWidget {
    constructor(element) {
        super(element);
        this.controller = new TextEditingController();
        this.validator = null;
        this.maxLines = parseInt(element.getAttribute('data-flutter-maxlines')) || 1;
    }

    initState() {
        super.initState();
        
        // TextEditingController のリスナーを設定
        this.element.addEventListener('input', (e) => {
            this.controller.text = e.target.value;
            this.controller.notifyListeners();
        });
    }

    // Flutter の TextFormField validation を模倣
    validate() {
        if (this.validator) {
            const error = this.validator(this.controller.text);
            if (error) {
                this.showError(error);
                return false;
            }
        }
        return true;
    }

    showError(message) {
        // エラー表示ロジック
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }
}

// TextEditingController を模倣
class TextEditingController {
    constructor() {
        this.text = '';
        this.listeners = [];
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }

    clear() {
        this.text = '';
        this.notifyListeners();
    }
}

// ListView.builder を模倣
class ListViewBuilder extends FlutterWidget {
    constructor(element) {
        super(element);
        this.itemCount = 0;
        this.itemBuilder = null;
    }

    build() {
        if (!this.itemBuilder) return;
        
        // 既存の要素をクリア
        this.element.innerHTML = '';
        
        // アイテムを構築
        for (let i = 0; i < this.itemCount; i++) {
            const item = this.itemBuilder(i);
            this.element.appendChild(item);
        }
    }

    // Flutter の ListView.builder パターンを模倣
    setItemBuilder(count, builder) {
        this.itemCount = count;
        this.itemBuilder = builder;
        this.build();
    }
}

// Card Widget を模倣
class CardWidget extends FlutterWidget {
    constructor(element) {
        super(element);
        this.elevation = 2;
        this.shape = 'RoundedRectangleBorder';
    }

    initState() {
        super.initState();
        
        // Material Design のリップル効果を追加
        this.addInkWell();
    }

    addInkWell() {
        this.element.addEventListener('click', (e) => {
            this.createRipple(e);
        });
    }

    createRipple(event) {
        const ripple = document.createElement('span');
        ripple.classList.add('flutter-ripple');
        
        const rect = this.element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
}

// Provider パターンを模倣
class Provider {
    static providers = new Map();

    static of(type, context) {
        return this.providers.get(type);
    }

    static provide(type, value) {
        this.providers.set(type, value);
    }
}

// Riverpod の StateNotifier を模倣
class StateNotifier {
    constructor(initialState) {
        this.state = initialState;
        this.listeners = [];
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.state));
    }
}

// DreamsNotifier (Riverpod StateNotifier を模倣)
class DreamsNotifier extends StateNotifier {
    constructor() {
        super({ dreams: [], isLoading: false });
    }

    addDream(dream) {
        this.updateState({
            dreams: [...this.state.dreams, dream]
        });
    }

    setLoading(isLoading) {
        this.updateState({ isLoading });
    }
}

// Flutter アプリケーションの初期化
class FlutterApp {
    constructor() {
        this.widgets = new Map();
        this.initProviders();
        this.initWidgets();
        this.addFlutterStyles();
    }

    initProviders() {
        // Provider パターンで状態管理を初期化
        Provider.provide('DreamsNotifier', new DreamsNotifier());
        Provider.provide('ThemeNotifier', new StateNotifier({ theme: 'default' }));
    }

    initWidgets() {
        // data-flutter-widget 属性を持つ要素を検索してWidget化
        document.querySelectorAll('[data-flutter-widget]').forEach(element => {
            const widgetType = element.getAttribute('data-flutter-widget');
            let widget;

            switch (widgetType) {
                case 'MaterialApp':
                    widget = new MaterialApp(element);
                    break;
                case 'AppBar':
                    widget = new Scaffold(element.closest('body'));
                    break;
                case 'TextFormField':
                    widget = new TextFormField(element);
                    break;
                case 'ListView.builder':
                    widget = new ListViewBuilder(element);
                    break;
                case 'Card':
                    widget = new CardWidget(element);
                    break;
                default:
                    widget = new FlutterWidget(element);
            }

            if (widget) {
                widget.initState();
                this.widgets.set(element, widget);
            }
        });
    }

    addFlutterStyles() {
        // Flutter Material Designのスタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            /* Flutter リップル効果 */
            .flutter-ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: scale(0);
                animation: flutter-ripple-animation 0.6s ease-out;
                pointer-events: none;
            }

            @keyframes flutter-ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            /* Flutter Card のホバー効果 */
            [data-flutter-widget="Card"] {
                position: relative;
                overflow: hidden;
                transition: box-shadow 0.2s ease;
            }

            [data-flutter-widget="Card"]:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            /* Flutter AnimatedContainer を模倣 */
            .flutter-animated {
                transition: all 0.3s ease;
            }

            /* Flutter Hero animation の準備 */
            .flutter-hero {
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            }
        `;
        document.head.appendChild(style);
    }

    // Flutter の Navigator.push を模倣
    navigatorPush(route) {
        console.log('Navigator.push:', route);
        // ルーティングロジック
    }

    // Flutter の showSnackBar を模倣
    showSnackBar(message, duration = 3000) {
        const snackbar = document.createElement('div');
        snackbar.className = 'flutter-snackbar';
        snackbar.textContent = message;
        
        document.body.appendChild(snackbar);
        
        setTimeout(() => {
            snackbar.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            snackbar.classList.remove('show');
            setTimeout(() => snackbar.remove(), 300);
        }, duration);
    }
}

// Flutter アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    window.flutterApp = new FlutterApp();
    
    console.log('🚀 Flutter Mock Application Started');
    console.log('📱 Widget Tree:', window.flutterApp.widgets);
    console.log('🎨 Theme:', MaterialApp.of(document.body));
    console.log('📦 Providers:', Provider.providers);
});

// Flutter Hot Reload を模倣（開発用）
if (module && module.hot) {
    module.hot.accept(() => {
        console.log('🔥 Hot Reload triggered');
        window.flutterApp = new FlutterApp();
    });
}