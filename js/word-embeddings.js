// 夢関連単語の簡易埋め込みベクトル
// 各単語を5次元のベクトルで表現（感情、活動性、意識レベル、社会性、象徴性）

const dreamWordEmbeddings = {
    // 感情関連
    '喜び': [0.9, 0.5, 0.7, 0.6, 0.3],
    '幸せ': [0.9, 0.3, 0.8, 0.7, 0.2],
    '楽しい': [0.8, 0.6, 0.7, 0.8, 0.2],
    '嬉しい': [0.8, 0.4, 0.7, 0.6, 0.2],
    '期待': [0.7, 0.5, 0.6, 0.5, 0.4],
    '安心': [0.6, 0.2, 0.7, 0.5, 0.3],
    '不安': [-0.7, 0.3, 0.4, 0.4, 0.5],
    '恐怖': [-0.9, 0.7, 0.2, 0.3, 0.6],
    '怖い': [-0.8, 0.6, 0.3, 0.3, 0.5],
    '悲しみ': [-0.7, 0.2, 0.5, 0.4, 0.4],
    '悲しい': [-0.7, 0.2, 0.5, 0.4, 0.4],
    '怒り': [-0.8, 0.8, 0.4, 0.5, 0.4],
    '寂しい': [-0.6, 0.1, 0.5, 0.3, 0.4],
    
    // 行動・動作
    '走る': [0.1, 0.9, 0.5, 0.3, 0.4],
    '飛ぶ': [0.3, 0.8, 0.1, 0.2, 0.9],
    '落ちる': [-0.5, 0.7, 0.2, 0.2, 0.8],
    '追われる': [-0.7, 0.8, 0.2, 0.3, 0.7],
    '逃げる': [-0.6, 0.9, 0.3, 0.2, 0.6],
    '戦う': [-0.2, 0.9, 0.4, 0.4, 0.6],
    '見る': [0.1, 0.2, 0.6, 0.4, 0.3],
    '話す': [0.2, 0.4, 0.7, 0.8, 0.2],
    '歩く': [0.1, 0.5, 0.6, 0.5, 0.2],
    '泳ぐ': [0.2, 0.6, 0.4, 0.3, 0.5],
    
    // 人物・関係
    '母': [0.4, 0.3, 0.8, 0.9, 0.5],
    '父': [0.3, 0.4, 0.8, 0.9, 0.5],
    '子供': [0.5, 0.5, 0.7, 0.8, 0.6],
    '友達': [0.6, 0.4, 0.8, 0.9, 0.3],
    '恋人': [0.7, 0.5, 0.7, 0.8, 0.4],
    '家族': [0.5, 0.3, 0.8, 0.9, 0.4],
    '他人': [0.0, 0.3, 0.6, 0.5, 0.4],
    '知らない人': [-0.2, 0.3, 0.4, 0.4, 0.5],
    
    // 場所
    '家': [0.6, 0.2, 0.9, 0.7, 0.3],
    '学校': [0.2, 0.4, 0.8, 0.8, 0.3],
    '職場': [0.1, 0.5, 0.8, 0.8, 0.2],
    '海': [0.3, 0.4, 0.3, 0.3, 0.8],
    '山': [0.2, 0.5, 0.4, 0.2, 0.7],
    '森': [0.1, 0.3, 0.3, 0.2, 0.8],
    '空': [0.4, 0.6, 0.2, 0.1, 0.9],
    
    // 物体・シンボル
    '水': [0.2, 0.3, 0.3, 0.3, 0.8],
    '火': [-0.1, 0.7, 0.3, 0.3, 0.8],
    '光': [0.6, 0.4, 0.2, 0.2, 0.9],
    '闇': [-0.6, 0.2, 0.1, 0.2, 0.9],
    '鏡': [0.0, 0.1, 0.4, 0.3, 0.8],
    '扉': [0.1, 0.3, 0.5, 0.4, 0.7],
    '車': [0.2, 0.6, 0.8, 0.6, 0.3],
    
    // 状態・現象
    '死': [-0.8, 0.1, 0.1, 0.4, 0.9],
    '生まれる': [0.7, 0.3, 0.2, 0.5, 0.9],
    '変身': [0.1, 0.5, 0.1, 0.2, 0.9],
    '消える': [-0.3, 0.2, 0.1, 0.2, 0.8],
    '迷う': [-0.4, 0.4, 0.4, 0.3, 0.6],
    '成功': [0.8, 0.6, 0.7, 0.7, 0.4],
    '失敗': [-0.6, 0.3, 0.6, 0.5, 0.4]
};

// コサイン類似度を計算
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    return dotProduct / (norm1 * norm2);
}

// 単語間の意味的距離を計算（0-1の範囲）
function getSemanticDistance(word1, word2) {
    const vec1 = dreamWordEmbeddings[word1];
    const vec2 = dreamWordEmbeddings[word2];
    
    if (!vec1 || !vec2) return 1; // 未知の単語は最大距離
    
    const similarity = cosineSimilarity(vec1, vec2);
    return 1 - ((similarity + 1) / 2); // -1〜1を0〜1に変換
}

// 単語のベクトルを取得（未知の単語はランダム）
function getWordVector(word) {
    if (dreamWordEmbeddings[word]) {
        return dreamWordEmbeddings[word];
    }
    
    // 未知の単語はランダムベクトルを生成
    const vec = [];
    for (let i = 0; i < 5; i++) {
        vec.push(Math.random() * 2 - 1);
    }
    return vec;
}

// 単語セットに対して2D座標を計算（簡易MDS）
function calculateWordPositions(words) {
    const n = words.length;
    if (n === 0) return [];
    
    // 距離行列を作成
    const distances = [];
    for (let i = 0; i < n; i++) {
        distances[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                distances[i][j] = 0;
            } else {
                distances[i][j] = getSemanticDistance(words[i].word, words[j].word);
            }
        }
    }
    
    // 簡易的なMDS（多次元尺度構成法）で2D座標を計算
    const positions = simpleMDS(distances, 2);
    
    // 結果を単語データと結合
    return words.map((wordData, i) => ({
        ...wordData,
        x: positions[i][0],
        y: positions[i][1]
    }));
}

// 簡易的なMDS実装
function simpleMDS(distances, dimensions = 2) {
    const n = distances.length;
    const positions = [];
    
    // ランダムな初期配置
    for (let i = 0; i < n; i++) {
        positions[i] = [];
        for (let d = 0; d < dimensions; d++) {
            positions[i][d] = (Math.random() - 0.5) * 2;
        }
    }
    
    // ストレス最小化（簡易版）
    const iterations = 50;
    const learningRate = 0.1;
    
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                // 現在の距離を計算
                let currentDist = 0;
                for (let d = 0; d < dimensions; d++) {
                    currentDist += Math.pow(positions[i][d] - positions[j][d], 2);
                }
                currentDist = Math.sqrt(currentDist);
                
                // 目標距離との差
                const targetDist = distances[i][j];
                if (currentDist > 0) {
                    const ratio = (targetDist - currentDist) / currentDist * learningRate;
                    
                    // 位置を調整
                    for (let d = 0; d < dimensions; d++) {
                        const diff = positions[i][d] - positions[j][d];
                        positions[i][d] += diff * ratio;
                        positions[j][d] -= diff * ratio;
                    }
                }
            }
        }
    }
    
    // 正規化（-1〜1の範囲に）
    for (let d = 0; d < dimensions; d++) {
        let min = positions[0][d];
        let max = positions[0][d];
        
        for (let i = 1; i < n; i++) {
            min = Math.min(min, positions[i][d]);
            max = Math.max(max, positions[i][d]);
        }
        
        const range = max - min;
        if (range > 0) {
            for (let i = 0; i < n; i++) {
                positions[i][d] = ((positions[i][d] - min) / range) * 2 - 1;
            }
        }
    }
    
    return positions;
}

// エクスポート
window.dreamWordEmbeddings = dreamWordEmbeddings;
window.getSemanticDistance = getSemanticDistance;
window.calculateWordPositions = calculateWordPositions;