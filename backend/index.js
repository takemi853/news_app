import express from 'express';
import dotenv from 'dotenv';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

// 環境変数を読み込む
dotenv.config();

const app = express();
// const PORT = process.env.PORT || 5001;
const PORT = parseInt(process.env.PORT, 10) || 8080;

// Vertex AI クライアント初期化
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
});
const generativeModel = vertexAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL,
  safetySettings: [{
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  }],
  generationConfig: { maxOutputTokens: 1024 },
});

// const news_date = new Date("2025-04-30"); // 日付を指定
// const news_date = new Date(); // 現在の日付を取得
const news_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式に変換
console.log('news_date:', news_date);
app.get('/api/fetch-news', async (_req, res) => {
  try {
    // プロンプト定義
    const prompt =  `
    # 指示: 最新のAIニュースを検索・分析し、指定されたJSON形式で出力してください。
    
    # 検索・選定・分析の要件:
    1.  **最新性:** 直近1〜2日（本日${news_date}含む）のAIに関する重要なニュースを対象とします。
    2.  **多様性:** 情報源は、主要ニュースサイト、IT系メディア、AI専門メディア、プレスリリースなど、信頼できる多様なソースから取得し、単一のサイトに偏らないようにしてください。
    3.  **件数:** 上記の条件に合うニュースの中から【2つ】を選定してください。
    4.  **情報と分析:** 各ニュースについて、以下の情報を取得し、必要に応じて分析・評価を加えてください。
        * \`title\`: ニュースのタイトル (文字列)
        * \`emoji\`: 内容に合った絵文字 (文字列)
        * \`summary\`: ニュースの概要 (文字列。製品名などはそのまま含める)
        * \`source\`: 情報源（メディア名/企業名） (文字列)
        * \`publication_date\`: 発表日 (\`YYYY-MM-DD\`形式の文字列)
        * \`url\`: 元記事のURL (文字列)
        * \`category\`: カテゴリ名の配列 (文字列の配列 \`[]\`)
        * \`analysis\`: 分析結果を含むオブジェクト (\`{}\`)。以下のキーを持つ:
            - \`impressiveness\`: 「何がすごいか？」の分析テキスト (文字列)
            - \`competitor_difference\`: 「競合との違い」の分析テキスト (文字列)
            - \`noteworthiness\`: 注目度に関するオブジェクト (\`{}\`)。以下のキーを持つ:
                + \`score_value\`: 注目度スコア (1〜5の数値)
                + \`score_max\`: スコアの最大値 (数値、常に5)
                + \`score_visual\`: スコアの視覚的表現 (例: "★★★★☆") (文字列)
                + \`text\`: 注目すべきポイントの分析テキスト (文字列)
    5.  **分析の質:** 分析項目は、公開情報や技術動向に基づいた洞察や評価を含むようにしてください。スコアは、影響度、新規性、関連性などを考慮して1から5の整数で判断してください。
    
    # 出力フォーマットの要件 (JSON):
    1.  全体を JSON形式 で出力してください。
    2.  ルート要素は、選定した5つのニュース項目を表す**JSONオブジェクトの配列** (\`[]\`) とします。
    3.  配列内の各ニュースオブジェクト (\`{}\`) には、上記キーをすべて含めてください。
    4.  JSONは整形（pretty-print）し、適切なインデントをつけてください。
    5.  出力はJSONデータのみとし、前後の挨拶や説明を一切含めないでください。
    6.  URLはしっかりアクセスできるかを確認してください。
    
    # 実行してください。
    `
;

    console.log('[fetch-news] prompt:', prompt);

    // Gemini API 呼び出し
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const raw = result.response.candidates[0].content.parts[0].text;
    console.log('[fetch-news] raw response:', raw);
    // コードフェンス (``` or ```json) を除去
    let cleaned = raw
    .trim()
    // 先頭の ```json や ``` を含む行を丸ごと削除
    .replace(/^[ \t]*```(?:json)?[^\n]*\r?\n/, '')
    // 末尾の ``` を含む行を丸ごと削除
    .replace(/\r?\n[ \t]*```[^\n]*$/, '')
    .trim();
    // ---------------- 安全パースロジック ----------------
    // try {
    //     // JSON として正常パースできればオブジェクトで返却
    //     const output = JSON.parse(cleaned);
    //     return res.json(output);
    //   } catch (parseErr) {
    //     console.warn('[fetch-news] JSON.parse failed, returning raw cleaned string', parseErr);
    //     // JSON 文字列としてそのまま返す
    //     res.setHeader('Content-Type', 'application/json');
    //     return res.status(200).send(cleaned);
    //   }
      // --------------------------------------------------

    console.log('[fetch-news1] cleaned JSON string:', cleaned);

    // JSON としてパース
    const output = JSON.parse(cleaned);
    return res.json(output);

  } catch (err) {
    console.error('[fetch-news] error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});