
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = process.env.GEMINI_URL;

export const generateAIResponse = async (prompt) => {
  try {
    if (!GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY is not set in environment variables");
      return null;
    }

    // Construct full URL if GEMINI_URL is just the base origin
    const baseUrl = GEMINI_URL.endsWith('/') ? GEMINI_URL.slice(0, -1) : GEMINI_URL;
    const url = baseUrl.includes('/v1beta/models/') 
      ? baseUrl 
      : `${baseUrl}/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      let bodyText = "<failed to read body>";
      try {
        bodyText = await response.text();
      } catch (e) {
        console.log("Failed to read Gemini error body:", e.message);
      }
      console.log(
        `Gemini API error: ${response.status} ${response.statusText}`,
      );
      console.log("Gemini response body:", bodyText);
      return null;
    }

    const data = await response.json();
    // If model returned an unexpected structure, log the full JSON for debugging
    if (!data) {
      console.log("Gemini returned empty JSON response");
      return null;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.log(
        "Gemini response missing expected candidates/content/parts/text. Full response:",
        JSON.stringify(data, null, 2),
      );
    }
    return text || null;
  } catch (error) {
    console.log("AI Service error:", error.stack || error.message);
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
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
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
      .map(
        (p, i) =>
          `Product ${i + 1}: ${p.name} — ${p.description?.substring(0, 80) || ""}`,
      )
      .join("\n");

    const prompt = `You are a product search ranking engine. A customer searched for: "${query}".
Here are the candidate products:
${productList}

Rank these products by relevance to the search query. Return ONLY a JSON array of product numbers ordered by most relevant first. Exclude any completely irrelevant products.
Example: [3, 1, 2]

Respond ONLY with the JSON array (no markdown, no code fences):`;

    const text = await generateAIResponse(prompt);
    if (!text) return null;

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
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

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
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
export const regenerateProductDescription = async (
  productInfo,
  currentDescription,
  instruction,
) => {
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

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
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
export const chatWithContext = async (
  userMessage,
  conversationHistory,
  productContext,
) => {
  try {
    let historyText = "";
    if (conversationHistory && conversationHistory.length > 0) {
      historyText =
        "\n\nConversation so far:\n" +
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
    if (text) {
      try {
        const cleaned = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        return {
          reply:
            parsed.reply ||
            "I'm sorry, I couldn't process that. Please try again.",
          suggestedProducts: Array.isArray(parsed.suggestedProducts)
            ? parsed.suggestedProducts
            : [],
        };
      } catch (parseErr) {
        console.log(
          "AI returned non-JSON or unparsable response:",
          parseErr.message,
        );
        // fall through to local fallback below
      }
    }

    // --- Local fallback when external AI is unavailable or returns invalid JSON ---
    // Try simple keyword matching against the provided productContext string.
    try {
      const fallbackReplyPrefix =
        "I couldn't reach the AI right now, but I can help with product search:\n";
      const lines = (productContext || "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const products = [];
      for (const line of lines) {
        // Expect lines like: "Product: NAME, Category: CAT, Price: $X, Description: ..., ID: id"
        const idMatch =
          line.match(/ID:\s*(\d+)/i) || line.match(/ID:\s*([a-f0-9\-]{6,})/i);
        const nameMatch = line.match(/Product:\s*([^,]+),/i);
        const catMatch = line.match(/Category:\s*([^,]+),/i);
        if (idMatch && nameMatch) {
          products.push({
            id: idMatch[1],
            name: nameMatch[1].trim(),
            category: (catMatch && catMatch[1]) || "",
          });
        }
      }

      // keyword extraction from userMessage
      const words = userMessage
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length >= 3);
      const matches = [];
      for (const p of products) {
        const lowName = p.name.toLowerCase();
        const lowCat = (p.category || "").toLowerCase();
        for (const w of words) {
          if (lowName.includes(w) || lowCat.includes(w)) {
            matches.push(p);
            break;
          }
        }
      }

      if (matches.length > 0) {
        const unique = [];
        const ids = new Set();
        for (const m of matches) {
          if (!ids.has(m.id)) {
            ids.add(m.id);
            unique.push(m);
          }
        }
        const names = unique
          .slice(0, 5)
          .map((p) => p.name)
          .join(", ");
        const suggested = unique.slice(0, 5).map((p) => p.id);
        return {
          reply: `${fallbackReplyPrefix}I found these matching products: ${names}. Would you like to view any of them?`,
          suggestedProducts: suggested,
        };
      }

      // No product matches — provide a generic helpful fallback
      return {
        reply:
          "I couldn't reach the AI right now. Try asking about product categories (for example: 'show me men's jackets') or mention a product name and I'll search for it.",
        suggestedProducts: [],
      };
    } catch (fbErr) {
      console.log("Fallback error:", fbErr.message);
      return {
        reply: "I'm sorry, I couldn't process that. Please try again.",
        suggestedProducts: [],
      };
    }
  } catch (error) {
    console.log("Chat with context error:", error.message);
    return {
      reply: "I'm sorry, I couldn't process that. Please try again.",
      suggestedProducts: [],
    };
  }
};
