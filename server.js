const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

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

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    if (!GEMINI_API_KEY) {
        console.log('Gemini APIを使用するには、GEMINI_API_KEY環境変数を設定してください');
    }
});