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

        const systemPrompt = `あなたは夢の内容を読み解く専門家です。
重要：難しい専門用語は使わず、誰にでもわかるやさしい日本語で説明してください。
夢に出てきた大切なものや出来事を見つけてください：
1. 人（家族、友だち、知らない人など）
2. 場所（家、学校、仕事場、自然の中など）
3. もの（乗り物、道具、食べ物、服など）
4. 生き物（ペット、動物、想像の生き物など）
5. 行動（飛ぶ、走る、追いかけられる、戦うなど）
6. 気持ち（怖い、うれしい、心配、腹が立つなど）
7. 色（特に印象に残った色）
8. 数字（何度も出てくる数字）

それぞれを短い言葉で表して、大切な順に並べてください。`;

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

        const systemPrompt = `あなたは夢の意味を読み解く専門家です。
重要：難しい専門用語は使わず、誰にでもわかるやさしい日本語で説明してください。小学生にもわかるような言葉を使ってください。
つまり、「象徴」「社会的なつながり」「自己実現」「内面の平和」「ポジティブ」「ストレスからの解放」のような難しい言葉は使わないでください。
夢に出てきたものが、あなたの心の中で何を表しているのかを、やさしい言葉で説明します。

次のことを考えながら夢を読み解きます：
1. 夢に出てきたものが持つ意味
2. それぞれのものがどうつながっているか
3. 夢全体が伝えたいこと
4. あなたの成長や今の悩みとの関係
5. 心の奥からのメッセージ`;

        const prompt = `次の夢と象徴について分析してください：

夢の内容：
"${dreamContent}"

夢に出てきたもの：
${symbols.map(s => `・${s}`).join('\n')}

以下の点に注意して分析してください：
- 夢に出てきたものがどんな場面で現れているか
- それぞれのものがどのようにつながっているか
- 夢全体が伝えようとしている統一的なメッセージは何か
- 現実生活での課題や状況との関連性

以下のJSON形式で回答してください：
{
  "dreamText": "${dreamContent}",
  "symbols": [
    {
      "symbol": "象徴名",
      "meaning": "これはあなたのどんな気持ちを表しているか、簡単に説明します（50-100文字程度）",
      "comment": "この夢のお話の中で、どんな役割をしているか説明します（100-150文字程度）",
      "interpretation": "もっと深い意味をかみくだいて説明します（80-120文字程度）"
    }
  ],
  "overallComment": "この夢全体が何を伝えようとしているか、わかりやすくまとめます（200-300文字程度）",
  "psychologicalMessage": "あなたの心が今、何を求めているかをお伝えします（100-200文字程度）",
  "dailyInsight": "今日意識したいこと（1文、30文字程度）",
  "dreamTheme": "この夢のキーワード（20-40文字程度）"
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