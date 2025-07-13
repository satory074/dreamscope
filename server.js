const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ログミドルウェア
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// テストエンドポイント
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Gemini API Key (環境変数から取得)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('警告: GEMINI_API_KEY環境変数が設定されていません');
}

// 夢分析エンドポイント
app.post('/api/analyze-dream', async (req, res) => {
    try {
        const { dreamContent, isKeywords, systemPrompt, prompt, type, word, words } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        let requestBody;
        
        if (type === 'word_vector') {
            // 単語ベクトル分析
            requestBody = {
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            };
        } else {
            // 通常の夢分析
            requestBody = {
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            };
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return res.status(response.status).json({ error: 'API request failed' });
        }

        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        
        res.json(result);
    } catch (error) {
        console.error('Error in analyze-dream:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 象徴抽出エンドポイント
app.post('/api/extract-symbols', async (req, res) => {
    console.log('=== /api/extract-symbols endpoint called ===');
    console.log('Request body:', req.body);
    
    try {
        const { dreamContent } = req.body;
        console.log('Dream content received:', dreamContent);

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ error: 'API key not configured on server' });
        }
        console.log('GEMINI_API_KEY is set');

        const systemPrompt = `あなたは夢の象徴を抽出する専門家です。
以下のカテゴリーから重要な象徴を抽出してください：
1. 人物（家族、友人、見知らぬ人、有名人など）
2. 場所（家、学校、職場、自然の場所など）
3. 物体（乗り物、道具、食べ物、衣服など）
4. 動物（ペット、野生動物、想像上の生き物など）
5. 行動（飛ぶ、走る、追いかけられる、戦うなど）
6. 感情（恐怖、喜び、不安、怒りなど）
7. 色彩（特に印象的な色）
8. 数字（繰り返し現れる数字）

各象徴は簡潔な単語や短いフレーズで表現し、最も重要なものから順に並べてください。`;

        const prompt = `次の夢から重要な象徴を抽出してください：
"${dreamContent}"

以下のJSON形式で回答してください：
{
  "symbols": [
    {
      "text": "象徴のテキスト",
      "category": "人物|場所|物体|動物|行動|感情|色彩|数字",
      "importance": "high|medium|low"
    }
  ]
}`;

        console.log('Calling Gemini API...');
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        console.log('API URL:', geminiUrl.replace(GEMINI_API_KEY, 'HIDDEN'));
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.5,
                    responseMimeType: "application/json"
                }
            })
        });

        console.log('Gemini API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return res.status(response.status).json({ error: 'API request failed' });
        }

        const data = await response.json();
        console.log('Gemini API raw response:', JSON.stringify(data));
        
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        console.log('Parsed result:', result);
        
        res.json(result);
    } catch (error) {
        console.error('Error in extract-symbols:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 象徴分析エンドポイント
app.post('/api/analyze-symbols', async (req, res) => {
    try {
        const { dreamContent, symbols } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const systemPrompt = `あなたは経験豊富な夢解釈の専門家です。
深層心理学（ユング心理学、フロイト心理学）の観点から、夢の象徴とその心理的意味を分析してください。
各象徴について、その一般的な意味と、この夢の文脈での具体的な意味を解釈してください。

以下の観点から分析してください：
1. 各象徴の個別の意味
2. 象徴同士の関係性と相互作用
3. 夢全体のテーマとの関連性
4. 個人的な成長や課題との関連
5. 無意識からのメッセージ`;

        const prompt = `次の夢と象徴について分析してください：

夢の内容：
"${dreamContent}"

象徴リスト：
${symbols.map(s => `・${s}`).join('\n')}

以下の点に注意して分析してください：
- 象徴が夢の中でどのような文脈で現れているか
- 象徴同士がどのように関連し合っているか
- 夢全体が伝えようとしている統一的なメッセージは何か
- 現実生活での課題や状況との関連性

以下のJSON形式で回答してください：
{
  "dreamText": "${dreamContent}",
  "symbols": [
    {
      "symbol": "象徴名",
      "meaning": "この象徴の心理的意味の説明（50-100文字程度）",
      "comment": "この象徴が夢の文脈でどのように現れ、どんな役割を果たしているかの詳細なコメント（100-150文字程度）",
      "interpretation": "ユング心理学やフロイト心理学の観点からの深い解釈（80-120文字程度）"
    }
  ],
  "overallComment": "夢全体の内容についての総合的なコメント。象徴同士の関係性、夢のストーリー展開、感情的な側面などを含む（200-300文字程度）",
  "psychologicalMessage": "深層心理からのメッセージ（100-200文字程度）",
  "dailyInsight": "今日の洞察（1文、30文字程度）",
  "dreamTheme": "この夢の主要なテーマ（20-40文字程度）"
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return res.status(response.status).json({ error: 'API request failed' });
        }

        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        
        res.json(result);
    } catch (error) {
        console.error('Error in analyze-symbols:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    if (!GEMINI_API_KEY) {
        console.log('Gemini APIを使用するには、GEMINI_API_KEY環境変数を設定してください');
    }
});