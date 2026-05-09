// AI Service Module — reusable for reviews, product descriptions, chatbot
// Uses Google Gemini API (free tier: 15 req/min, 1500/day)
// No npm package needed — uses native fetch()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generic AI response generator.
 * Sends a prompt to Gemini and returns the generated text.
 * Returns null on any error (never crashes the app).
 */
export const generateAIResponse = async (prompt) => {
    try {
        if (!GEMINI_API_KEY) {
            console.log("GEMINI_API_KEY is not set in environment variables");
            return null;
        }

        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
        });

        if (!response.ok) {
            console.log(`Gemini API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || null;
    } catch (error) {
        console.log("AI Service error:", error.message);
        return null;
    }
};

/**
 * Summarize product reviews using AI.
 * Takes an array of { rating, comment } objects.
 * Returns { summary, pros, cons } or null on failure.
 */
export const summarizeReviews = async (reviews) => {
    try {
        const reviewList = reviews
            .map((r, i) => `Review ${i + 1} (${r.rating}/5 stars): ${r.comment}`)
            .join("\n");

        const prompt = `You are a helpful product review analyzer. Below are customer reviews for a product. 
Analyze them and provide a structured summary.

Reviews:
${reviewList}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "summary": "A concise 2-3 sentence overall summary of what customers think about this product",
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"]
}`;

        const text = await generateAIResponse(prompt);
        if (!text) return null;

        // Clean up response — strip markdown code fences if present
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
            summary: parsed.summary || "",
            pros: Array.isArray(parsed.pros) ? parsed.pros : [],
            cons: Array.isArray(parsed.cons) ? parsed.cons : [],
        };
    } catch (error) {
        console.log("Review summarization error:", error.message);
        return null;
    }
};

/**
 * Rank products by relevance to a search query using AI.
 * Returns an array of product indices (1-based) ordered by relevance, or null on failure.
 */
export const rankProductByRelevance = async (query, products) => {
    try {
        const productList = products
            .map((p, i) => `Product ${i + 1}: ${p.name} — ${p.description?.substring(0, 80) || ""}`)
            .join("\n");

        const prompt = `You are a product search ranking engine. A customer searched for: "${query}".
Here are the candidate products:
${productList}

Rank these products by relevance to the search query. Return ONLY a JSON array of product numbers ordered by most relevant first. Exclude any completely irrelevant products.
Example: [3, 1, 2]

Respond ONLY with the JSON array (no markdown, no code fences):`;

        const text = await generateAIResponse(prompt);
        if (!text) return null;

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.log("Product ranking error:", error.message);
        return null;
    }
};

/**
 * Generate a product description using AI.
 * Returns { description, highlights } or null on failure.
 */
export const generateProductDescription = async (productInfo) => {
    try {
        const { name, category, subCategory, sizes, price, keywords } = productInfo;

        const prompt = `You are an expert e-commerce copywriter. Write a professional, engaging product description.

Product details:
- Name: ${name}
- Category: ${category}${subCategory ? `, Sub-category: ${subCategory}` : ""}${price ? `, Price: $${price}` : ""}${sizes ? `, Available sizes: ${JSON.stringify(sizes)}` : ""}${keywords ? `\n- Key features/notes from seller: ${keywords}` : ""}

Write a compelling 2-3 paragraph product description that highlights key features, mentions the target audience, and uses SEO-friendly language.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "description": "The full product description text here",
  "highlights": ["key feature 1", "key feature 2", "key feature 3"]
}`;

        const text = await generateAIResponse(prompt);
        if (!text) return null;

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
            description: parsed.description || "",
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        };
    } catch (error) {
        console.log("Product description generation error:", error.message);
        return null;
    }
};

/**
 * Regenerate a product description with seller refinement instructions.
 * Returns { description, highlights } or null on failure.
 */
export const regenerateProductDescription = async (productInfo, currentDescription, instruction) => {
    try {
        const { name, category } = productInfo;

        const prompt = `You are an expert e-commerce copywriter. Here is the current product description for "${name}" (${category}):

"${currentDescription}"

The seller wants you to: ${instruction}

Rewrite the description accordingly. Keep it professional and SEO-friendly.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "description": "The rewritten product description text here",
  "highlights": ["key feature 1", "key feature 2", "key feature 3"]
}`;

        const text = await generateAIResponse(prompt);
        if (!text) return null;

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
            description: parsed.description || "",
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        };
    } catch (error) {
        console.log("Product description regeneration error:", error.message);
        return null;
    }
};

/**
 * Chat with AI using conversation history and product context.
 * Returns { reply, suggestedProducts } or a fallback on failure.
 */
export const chatWithContext = async (userMessage, conversationHistory, productContext) => {
    try {
        let historyText = "";
        if (conversationHistory && conversationHistory.length > 0) {
            historyText = "\n\nConversation so far:\n" +
                conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n");
        }

        const prompt = `You are a helpful shopping assistant for an online multi-vendor e-commerce store. You help customers find products, answer questions about products, and provide recommendations.

Here are some products currently available in the store:
${productContext || "No products loaded yet."}
${historyText}

Customer: ${userMessage}

Instructions:
- Respond naturally and helpfully
- If the customer asks about a product, reference actual products from the list above
- If the product isn't in the store, say so honestly
- Keep responses concise (2-4 sentences)

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "reply": "Your response to the customer",
  "suggestedProducts": ["product_id_1", "product_id_2"]
}
The suggestedProducts array should contain product IDs from the list above that are relevant. Leave it empty if no specific products are being recommended.`;

        const text = await generateAIResponse(prompt);
        if (!text) {
            return { reply: "I'm sorry, I couldn't process that. Please try again.", suggestedProducts: [] };
        }

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
            reply: parsed.reply || "I'm sorry, I couldn't process that. Please try again.",
            suggestedProducts: Array.isArray(parsed.suggestedProducts) ? parsed.suggestedProducts : [],
        };
    } catch (error) {
        console.log("Chat with context error:", error.message);
        return { reply: "I'm sorry, I couldn't process that. Please try again.", suggestedProducts: [] };
    }
};