// DreamScope API Service - Secure API handling for OpenAI and future Gemini integration

/**
 * API Service for handling dream analysis requests
 */
class APIService {
    constructor() {
        this.currentProvider = 'openai'; // Default to OpenAI, will switch to Gemini later
        this.requestTimeout = CONSTANTS.API.REQUEST_TIMEOUT;
    }

    /**
     * Set API provider (openai or gemini)
     * @param {string} provider - API provider name
     */
    setProvider(provider) {
        if (['openai', 'gemini'].includes(provider)) {
            this.currentProvider = provider;
        } else {
            throw new Error('Invalid API provider');
        }
    }

    /**
     * Validate API key before making requests
     * @param {string} apiKey - API key to validate
     * @returns {boolean} - Is valid
     */
    validateApiKey(apiKey) {
        if (this.currentProvider === 'openai') {
            return SecurityUtils.validateApiKey(apiKey);
        } else if (this.currentProvider === 'gemini') {
            // Gemini API key validation (different format)
            return typeof apiKey === 'string' && apiKey.length > 20;
        }
        return false;
    }

    /**
     * Analyze dream content using selected AI provider
     * @param {string} content - Dream content to analyze
     * @param {boolean} isKeywords - Whether input is keywords or full text
     * @param {string} apiKey - API key for the service
     * @returns {Promise<Object>} - Analysis result
     */
    async analyzeDream(content, isKeywords = false, apiKey = null) {
        // Validate input
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid dream content');
        }

        // Sanitize content
        const sanitizedContent = SecurityUtils.sanitizeHTML(content);

        // Use mock analysis if no API key provided
        if (!apiKey || !this.validateApiKey(apiKey)) {
            console.warn('No valid API key provided, using mock analysis');
            return this.generateMockAnalysis(sanitizedContent, isKeywords);
        }

        try {
            if (this.currentProvider === 'openai') {
                return await this.analyzeWithOpenAI(sanitizedContent, isKeywords, apiKey);
            } else if (this.currentProvider === 'gemini') {
                return await this.analyzeWithGemini(sanitizedContent, isKeywords, apiKey);
            }
        } catch (error) {
            console.error('API analysis failed, falling back to mock:', error);
            return this.generateMockAnalysis(sanitizedContent, isKeywords);
        }
    }

    /**
     * Analyze dream with OpenAI GPT-4
     * @param {string} content - Sanitized dream content
     * @param {boolean} isKeywords - Whether input is keywords
     * @param {string} apiKey - OpenAI API key
     * @returns {Promise<Object>} - Analysis result
     */
    async analyzeWithOpenAI(content, isKeywords, apiKey) {
        const prompt = this.buildOpenAIPrompt(content, isKeywords);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(CONSTANTS.API.OPENAI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: CONSTANTS.API.MODEL_GPT4,
                    messages: [
                        {
                            role: 'system',
                            content: 'あなたは夢の解釈の専門家です。ユング心理学と認知心理学の観点から夢を分析します。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: CONSTANTS.API.TEMPERATURE,
                    max_tokens: CONSTANTS.API.MAX_TOKENS,
                    response_format: { type: "json_object" }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            // Validate and sanitize the response
            return this.sanitizeAnalysisResult(result);
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw ErrorHandler.handleApiError(error, 'OpenAI dream analysis');
        }
    }

    /**
     * Analyze dream with Google Gemini (future implementation)
     * @param {string} content - Sanitized dream content
     * @param {boolean} isKeywords - Whether input is keywords
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<Object>} - Analysis result
     */
    async analyzeWithGemini(content, isKeywords, apiKey) {
        // TODO: Implement Gemini API integration
        // For now, return mock analysis
        console.log('Gemini integration not yet implemented, using mock analysis');
        return this.generateMockAnalysis(content, isKeywords);
    }

    /**
     * Build prompt for OpenAI API
     * @param {string} content - Dream content
     * @param {boolean} isKeywords - Whether input is keywords
     * @returns {string} - Formatted prompt
     */
    buildOpenAIPrompt(content, isKeywords) {
        const inputType = isKeywords ? 'キーワード' : '夢の内容';
        
        return `以下の夢の${inputType}を心理学的に解釈してください。

${inputType}: ${content}

以下の形式でJSONで回答してください:
{
    "dreamText": "${content}",
    "symbols": [
        {"symbol": "シンボル名", "meaning": "意味の説明"}
    ],
    "psychologicalMessage": "深層心理からのメッセージ",
    "dailyInsight": "今日の気づき（1文）"
}

注意点:
- symbols配列には最大5つのシンボルを含めてください
- 心理学的に意味のある解釈を提供してください
- 日本語で回答してください
- JSONフォーマットを厳密に守ってください`;
    }

    /**
     * Generate mock analysis for demonstration or fallback
     * @param {string} content - Dream content
     * @param {boolean} isKeywords - Whether input is keywords
     * @returns {Object} - Mock analysis result
     */
    generateMockAnalysis(content, isKeywords) {
        const words = content.split(/\s+/).filter(word => word.length > 0);
        const dreamText = content;
        
        // Generate symbols from words
        const symbols = words.slice(0, 3).map(word => {
            const meanings = [
                '内面の変化を象徴している可能性があります',
                '成長への願望を表しているかもしれません',
                '不安や恐れを表現している可能性があります',
                '希望や期待を象徴している可能性があります',
                '新しい挑戦への準備を表しているかもしれません'
            ];
            
            return {
                symbol: SecurityUtils.sanitizeHTML(word),
                meaning: `「${SecurityUtils.sanitizeHTML(word)}」は${meanings[Math.floor(Math.random() * meanings.length)]}`
            };
        });
        
        const messages = [
            '今のあなたは新しい可能性に向かって進む準備ができています。',
            '内なる声に耳を傾け、本当の気持ちと向き合う時期かもしれません。',
            '変化を恐れず、自分を信じて一歩踏み出してみましょう。',
            '潜在的な才能や能力が開花する時期が近づいています。',
            '過去の経験から学び、未来への道筋を見つける時です。'
        ];
        
        const insights = [
            '今日は小さな挑戦から始めてみよう',
            '自分の感情を大切にする一日に',
            '新しい視点で物事を見てみる',
            '直感を信じて行動してみよう',
            '感謝の気持ちを忘れずに過ごそう'
        ];
        
        return {
            dreamText,
            symbols,
            psychologicalMessage: messages[Math.floor(Math.random() * messages.length)],
            dailyInsight: insights[Math.floor(Math.random() * insights.length)]
        };
    }

    /**
     * Sanitize analysis result from API
     * @param {Object} result - Raw API result
     * @returns {Object} - Sanitized result
     */
    sanitizeAnalysisResult(result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid API response format');
        }

        const sanitized = {
            dreamText: SecurityUtils.sanitizeHTML(result.dreamText || ''),
            symbols: [],
            psychologicalMessage: SecurityUtils.sanitizeHTML(result.psychologicalMessage || ''),
            dailyInsight: SecurityUtils.sanitizeHTML(result.dailyInsight || '')
        };

        // Sanitize symbols array
        if (Array.isArray(result.symbols)) {
            sanitized.symbols = result.symbols.slice(0, 5).map(symbol => ({
                symbol: SecurityUtils.sanitizeHTML(symbol.symbol || ''),
                meaning: SecurityUtils.sanitizeHTML(symbol.meaning || '')
            }));
        }

        return sanitized;
    }

    /**
     * Fetch word vector from AI (for word analysis features)
     * @param {string} word - Word to analyze
     * @param {string} apiKey - API key
     * @returns {Promise<Array>} - Word vector
     */
    async fetchWordVector(word, apiKey) {
        if (!word || !apiKey) {
            throw new Error('Word and API key are required');
        }

        const sanitizedWord = SecurityUtils.sanitizeHTML(word);
        
        if (this.currentProvider === 'openai') {
            return await this.fetchWordVectorFromOpenAI(sanitizedWord, apiKey);
        } else if (this.currentProvider === 'gemini') {
            // TODO: Implement Gemini word vector fetching
            throw new Error('Gemini word vector fetching not yet implemented');
        }
    }

    /**
     * Fetch word vector from OpenAI
     * @param {string} word - Sanitized word
     * @param {string} apiKey - OpenAI API key
     * @returns {Promise<Array>} - Word vector
     */
    async fetchWordVectorFromOpenAI(word, apiKey) {
        const prompt = `以下の単語「${word}」について、夢分析の観点から5つの特徴を-1.0から1.0の範囲で評価してください。

特徴:
1. 感情 (ネガティブ:-1.0 ← → ポジティブ:1.0)
2. 活動性 (受動的:-1.0 ← → 能動的:1.0)
3. 意識レベル (無意識的:-1.0 ← → 意識的:1.0)
4. 社会性 (個人的:-1.0 ← → 社会的:1.0)
5. 象徴性 (具体的:-1.0 ← → 象徴的:1.0)

必ず以下のJSON形式で回答してください:
{
    "word": "${word}",
    "vector": [感情値, 活動性値, 意識レベル値, 社会性値, 象徴性値],
    "explanation": "この評価の簡単な説明"
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(CONSTANTS.API.OPENAI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: CONSTANTS.API.MODEL_GPT4,
                    messages: [
                        {
                            role: 'system',
                            content: 'あなたは夢分析の専門家です。単語の意味的特徴を数値化して評価します。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: CONSTANTS.API.TEMPERATURE,
                    response_format: { type: "json_object" }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            // Validate vector format
            if (!Array.isArray(result.vector) || result.vector.length !== 5) {
                throw new Error('Invalid vector format from API');
            }

            return result.vector;
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw ErrorHandler.handleApiError(error, 'OpenAI word vector fetch');
        }
    }

    /**
     * Batch fetch word vectors for multiple words
     * @param {Array<string>} words - Words to analyze
     * @param {string} apiKey - API key
     * @returns {Promise<Object>} - Word vectors map
     */
    async fetchMultipleWordVectors(words, apiKey) {
        if (!Array.isArray(words) || words.length === 0) {
            return {};
        }

        const sanitizedWords = words.map(word => SecurityUtils.sanitizeHTML(word));
        
        if (this.currentProvider === 'openai') {
            return await this.fetchMultipleWordVectorsFromOpenAI(sanitizedWords, apiKey);
        } else if (this.currentProvider === 'gemini') {
            // TODO: Implement Gemini batch word vector fetching
            throw new Error('Gemini batch word vector fetching not yet implemented');
        }
    }

    /**
     * Fetch multiple word vectors from OpenAI
     * @param {Array<string>} words - Sanitized words
     * @param {string} apiKey - OpenAI API key
     * @returns {Promise<Object>} - Word vectors map
     */
    async fetchMultipleWordVectorsFromOpenAI(words, apiKey) {
        const prompt = `以下の単語リストについて、夢分析の観点から各単語の5つの特徴を-1.0から1.0の範囲で評価してください。

単語リスト: ${words.join(', ')}

特徴:
1. 感情 (ネガティブ:-1.0 ← → ポジティブ:1.0)
2. 活動性 (受動的:-1.0 ← → 能動的:1.0)
3. 意識レベル (無意識的:-1.0 ← → 意識的:1.0)
4. 社会性 (個人的:-1.0 ← → 社会的:1.0)
5. 象徴性 (具体的:-1.0 ← → 象徴的:1.0)

必ず以下のJSON形式で回答してください:
{
    "words": [
        {
            "word": "単語1",
            "vector": [感情値, 活動性値, 意識レベル値, 社会性値, 象徴性値]
        },
        {
            "word": "単語2",
            "vector": [感情値, 活動性値, 意識レベル値, 社会性値, 象徴性値]
        }
    ]
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(CONSTANTS.API.OPENAI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: CONSTANTS.API.MODEL_GPT4,
                    messages: [
                        {
                            role: 'system',
                            content: 'あなたは夢分析の専門家です。単語の意味的特徴を数値化して評価します。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: CONSTANTS.API.TEMPERATURE,
                    response_format: { type: "json_object" }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            // Convert array to map
            const vectorMap = {};
            if (Array.isArray(result.words)) {
                result.words.forEach(wordData => {
                    if (wordData.word && Array.isArray(wordData.vector) && wordData.vector.length === 5) {
                        vectorMap[wordData.word] = wordData.vector;
                    }
                });
            }

            return vectorMap;
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw ErrorHandler.handleApiError(error, 'OpenAI batch word vector fetch');
        }
    }
}

// Create global instance
window.apiService = new APIService();