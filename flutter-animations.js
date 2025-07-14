/**
 * Flutter Animations JavaScript
 * 
 * FlutterのHeroアニメーションやその他の複雑なアニメーションを
 * JavaScriptで実装
 */

// Hero Animation Controller
class HeroAnimationController {
    constructor() {
        this.activeHeroes = new Map();
        this.animationDuration = 300;
    }

    /**
     * Flutter の Navigator.push での Hero アニメーションを模倣
     * @param {string} tag - Hero タグ
     * @param {HTMLElement} fromElement - 遷移元要素
     * @param {HTMLElement} toElement - 遷移先要素
     */
    animateHero(tag, fromElement, toElement) {
        if (!fromElement || !toElement) return;

        // 開始位置と終了位置を取得
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        // クローン要素を作成（アニメーション用）
        const heroClone = fromElement.cloneNode(true);
        heroClone.classList.add('flutter-hero-animating');
        heroClone.style.position = 'fixed';
        heroClone.style.top = `${fromRect.top}px`;
        heroClone.style.left = `${fromRect.left}px`;
        heroClone.style.width = `${fromRect.width}px`;
        heroClone.style.height = `${fromRect.height}px`;
        heroClone.style.margin = '0';
        heroClone.style.zIndex = '9999';

        // 元の要素を非表示
        fromElement.style.opacity = '0';
        toElement.style.opacity = '0';

        // クローンをDOMに追加
        document.body.appendChild(heroClone);

        // アニメーション開始
        requestAnimationFrame(() => {
            heroClone.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
            heroClone.style.top = `${toRect.top}px`;
            heroClone.style.left = `${toRect.left}px`;
            heroClone.style.width = `${toRect.width}px`;
            heroClone.style.height = `${toRect.height}px`;
        });

        // アニメーション完了後の処理
        setTimeout(() => {
            toElement.style.opacity = '1';
            heroClone.remove();
            fromElement.style.opacity = '1';
        }, this.animationDuration);
    }
}

// AnimatedContainer Controller
class AnimatedContainerController {
    constructor(element) {
        this.element = element;
        this.properties = {};
        this.duration = 300;
        this.curve = 'cubic-bezier(0.4, 0.0, 0.2, 1)';
    }

    /**
     * Flutter の AnimatedContainer.setState を模倣
     * @param {Object} newProperties - 新しいプロパティ
     */
    animate(newProperties) {
        // トランジション設定
        const transitionProperties = Object.keys(newProperties).join(', ');
        this.element.style.transition = `${transitionProperties} ${this.duration}ms ${this.curve}`;

        // プロパティを適用
        Object.entries(newProperties).forEach(([key, value]) => {
            this.element.style[key] = value;
        });

        // プロパティを保存
        this.properties = { ...this.properties, ...newProperties };
    }

    /**
     * アニメーション時間を設定
     * @param {number} milliseconds - ミリ秒
     */
    setDuration(milliseconds) {
        this.duration = milliseconds;
    }

    /**
     * アニメーションカーブを設定
     * @param {string} curve - CSS timing function
     */
    setCurve(curve) {
        this.curve = curve;
    }
}

// AnimatedList Controller
class AnimatedListController {
    constructor(listElement) {
        this.listElement = listElement;
        this.items = [];
    }

    /**
     * アイテムを追加（アニメーション付き）
     * @param {HTMLElement} item - 追加する要素
     * @param {number} index - 挿入位置
     */
    insertItem(item, index = null) {
        item.classList.add('flutter-animated-list-item-enter');
        
        if (index === null || index >= this.items.length) {
            this.listElement.appendChild(item);
            this.items.push(item);
        } else {
            this.listElement.insertBefore(item, this.items[index]);
            this.items.splice(index, 0, item);
        }

        // アニメーション後にクラスを削除
        setTimeout(() => {
            item.classList.remove('flutter-animated-list-item-enter');
        }, 300);
    }

    /**
     * アイテムを削除（アニメーション付き）
     * @param {number} index - 削除するアイテムのインデックス
     */
    removeItem(index) {
        if (index < 0 || index >= this.items.length) return;

        const item = this.items[index];
        item.classList.add('flutter-animated-list-item-exit');

        // アニメーション完了後に削除
        setTimeout(() => {
            item.remove();
            this.items.splice(index, 1);
        }, 300);
    }
}

// Staggered Animation Controller
class StaggeredAnimationController {
    constructor(container) {
        this.container = container;
        this.delay = 50; // 各アイテム間の遅延
    }

    /**
     * 子要素を段階的にアニメーション
     */
    animate() {
        const children = Array.from(this.container.children);
        
        children.forEach((child, index) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                child.style.transition = 'all 300ms ease-out';
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            }, index * this.delay);
        });
    }
}

// Animated Icon Controller
class AnimatedIconController {
    constructor(element) {
        this.element = element;
        this.isForward = true;
    }

    /**
     * アイコンの状態を切り替え
     */
    toggle() {
        if (this.isForward) {
            this.forward();
        } else {
            this.reverse();
        }
        this.isForward = !this.isForward;
    }

    forward() {
        this.element.classList.add('active');
    }

    reverse() {
        this.element.classList.remove('active');
    }
}

// Page Transition Controller
class PageTransitionController {
    constructor() {
        this.currentPage = null;
        this.transitionType = 'slide'; // fade, slide, scale
    }

    /**
     * ページ遷移アニメーション
     * @param {HTMLElement} fromPage - 遷移元ページ
     * @param {HTMLElement} toPage - 遷移先ページ
     * @param {string} type - トランジションタイプ
     */
    transition(fromPage, toPage, type = 'slide') {
        if (!fromPage || !toPage) return;

        // 遷移先ページを準備
        toPage.style.display = 'block';
        toPage.classList.add(`flutter-page-transition-${type}`);

        // 遷移元ページをフェードアウト
        fromPage.style.opacity = '0';

        // アニメーション完了後の処理
        setTimeout(() => {
            fromPage.style.display = 'none';
            fromPage.style.opacity = '1';
            toPage.classList.remove(`flutter-page-transition-${type}`);
        }, 300);
    }
}

// Shimmer Effect Controller
class ShimmerEffectController {
    constructor(element) {
        this.element = element;
        this.isActive = false;
    }

    start() {
        if (this.isActive) return;
        this.element.classList.add('flutter-shimmer');
        this.isActive = true;
    }

    stop() {
        this.element.classList.remove('flutter-shimmer');
        this.isActive = false;
    }
}

// カスタムアニメーションカーブ
const FlutterCurves = {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    fastOutSlowIn: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounceIn: 'cubic-bezier(0.17, 0.89, 0.32, 1.28)',
    bounceOut: 'cubic-bezier(0.63, -0.28, 0.83, 0.11)',
    elasticIn: 'cubic-bezier(0.15, -0.55, 0.35, 1.65)',
    elasticOut: 'cubic-bezier(0.65, -0.65, 0.85, 1.55)'
};

// グローバルアニメーションコントローラー
const flutterAnimations = {
    hero: new HeroAnimationController(),
    pageTransition: new PageTransitionController(),
    curves: FlutterCurves,

    // ユーティリティ関数
    createAnimatedContainer(element) {
        return new AnimatedContainerController(element);
    },

    createAnimatedList(element) {
        return new AnimatedListController(element);
    },

    createStaggeredAnimation(element) {
        return new StaggeredAnimationController(element);
    },

    createAnimatedIcon(element) {
        return new AnimatedIconController(element);
    },

    createShimmer(element) {
        return new ShimmerEffectController(element);
    }
};

// DOMContentLoaded でアニメーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Flutter Animations Initialized');

    // AnimatedContainer の例
    const animatedContainers = document.querySelectorAll('.flutter-animated-container');
    animatedContainers.forEach(container => {
        const controller = flutterAnimations.createAnimatedContainer(container);
        container._animationController = controller;
    });

    // Staggered Animation の例
    const staggeredContainers = document.querySelectorAll('.flutter-staggered-animation');
    staggeredContainers.forEach(container => {
        const controller = flutterAnimations.createStaggeredAnimation(container);
        // IntersectionObserver で表示時にアニメーション
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    controller.animate();
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(container);
    });

    // Animated Icons の例
    const animatedIcons = document.querySelectorAll('.flutter-animated-icon');
    animatedIcons.forEach(icon => {
        const controller = flutterAnimations.createAnimatedIcon(icon);
        icon.addEventListener('click', () => controller.toggle());
    });
});

// エクスポート（モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = flutterAnimations;
}