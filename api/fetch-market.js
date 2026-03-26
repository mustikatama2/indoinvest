const FETCH_PROMPT = `Search for today's latest data on these Indonesian market indicators. Return ONLY a JSON object with no other text, no markdown, no backticks:
{
  "fx": <USD/IDR exchange rate as number, e.g. 16850>,
  "sbn10y": <Indonesia 10-year government bond yield as number, e.g. 6.45>,
  "oil": <Brent crude oil price in USD as number, e.g. 97>,
  "ihsg": <Jakarta Composite Index IHSG/JCI level as number, e.g. 7100>,
  "bbcaPrice": <BBCA stock closing price in Rupiah as number, e.g. 6825>,
  "bbriPrice": <BBRI stock closing price in Rupiah as number, e.g. 3480>,
  "bmriPrice": <BMRI stock closing price in Rupiah as number, e.g. 4840>,
  "foreignFlow": <estimated monthly foreign net buy/sell in Indonesian stock market in trillions of Rupiah, negative means net sell, e.g. -3.0>,
  "biRate": <Bank Indonesia benchmark interest rate as number, e.g. 4.75>,
  "date": "<today's date as YYYY-MM-DD>"
}
Search for: IHSG today, USD IDR exchange rate, Indonesia 10 year bond yield, Brent crude oil price, BBCA stock price, BBRI stock price, BMRI stock price. Use the most recent available data.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel environment variables' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: FETCH_PROMPT }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || 'Anthropic API error' });
    }

    // Extract text blocks
    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
    const fullText = textBlocks.join('\n');

    // Parse JSON from response
    const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'No JSON found in AI response', raw: fullText.slice(0, 300) });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
