const DEFAULT_GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "with",
  "show",
  "find",
  "search",
  "looking",
  "look",
  "need",
  "want",
  "please",
  "me",
  "i",
  "my",
  "you",
  "your",
  "product",
  "products",
  "item",
  "items",
]);

const SYNONYMS = {
  cheap: ["affordable", "budget", "low price", "inexpensive", "value"],
  modern: ["contemporary", "minimal", "sleek", "stylish"],
  office: ["work", "desk", "professional"],
  hoodie: ["sweatshirt", "pullover", "hooded"],
  jacket: ["coat", "outerwear", "winterwear"],
  chair: ["seat", "seating"],
  cotton: ["soft", "breathable", "fabric"],
  oversized: ["relaxed", "loose", "baggy"],
};

const parseJsonFromText = (text) => {
  if (!text) return null;

  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("No JSON object found");
    }

    const jsonString = cleaned.slice(start, end + 1);

    return JSON.parse(jsonString);
  } catch (error) {
    console.log("JSON Parse Error:", error.message);
    console.log("Problematic Text:", text);
    return null;
  }
};

export const getSearchIntent = (query = "") => {
  const normalized = query.toLowerCase();
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));

  const terms = new Set(tokens);
  for (const token of tokens) {
    for (const synonym of SYNONYMS[token] || []) {
      synonym.split(/\s+/).forEach((word) => terms.add(word));
    }
  }

  let maxPrice = null;
  const underMatch = normalized.match(
    /\b(?:under|below|less than|max|maximum)\s*\$?\s*(\d+(?:\.\d+)?)/,
  );
  if (underMatch) maxPrice = Number(underMatch[1]);
  if (
    ["cheap", "affordable", "budget", "inexpensive"].some((word) =>
      normalized.includes(word),
    )
  ) {
    maxPrice = maxPrice || 50;
  }

  let minPrice = null;
  if (
    ["premium", "luxury", "high end", "expensive"].some((word) =>
      normalized.includes(word),
    )
  ) {
    minPrice = 75;
  }

  const categories = [];
  if (/\bmen'?s?\b|\bmale\b/.test(normalized)) categories.push("Men");
  if (/\bwomen'?s?\b|\bfemale\b|\bladies\b/.test(normalized)) {
    categories.push("Women");
  }
  if (/\bkids?\b|\bchildren\b|\bchild\b/.test(normalized)) {
    categories.push("Kids");
  }

  const subCategories = [];
  if (/\btop|shirt|hoodie|jacket|coat|sweater|blouse\b/.test(normalized)) {
    subCategories.push("Topwear");
  }
  if (/\bbottom|pants|trouser|jeans|shorts|skirt\b/.test(normalized)) {
    subCategories.push("Bottomwear");
  }
  if (/\bwinter|warm|jacket|coat|sweater\b/.test(normalized)) {
    subCategories.push("Winterwear");
  }

  return {
    original: query,
    terms: [...terms],
    maxPrice,
    minPrice,
    categories,
    subCategories,
  };
};

export const scoreProductForIntent = (product, intent) => {
  const productSubCategory = product.sub_category || product.subCategory;
  const haystack = [
    product.name,
    product.description,
    product.category,
    productSubCategory,
    product.seller_name,
    product.seller_shop,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const term of intent.terms || []) {
    if (!term) continue;
    if ((product.name || "").toLowerCase().includes(term)) score += 8;
    else if (haystack.includes(term)) score += 3;
  }

  if (intent.categories?.includes(product.category)) score += 6;
  if (intent.subCategories?.includes(productSubCategory)) score += 5;
  if (intent.maxPrice && Number(product.price) <= intent.maxPrice) score += 4;
  if (intent.minPrice && Number(product.price) >= intent.minPrice) score += 3;
  if (product.bestseller) score += 1;

  return score;
};

const localProductDescription = ({ name, category, subCategory, sizes, price, keywords }) => {
  const cleanName = name || "This product";
  const sizeText =
    Array.isArray(sizes) && sizes.length > 0
      ? ` Available in ${sizes.join(", ")}.`
      : "";
  const priceText = price
    ? ` At $${price}, it is positioned for shoppers who want style and everyday value.`
    : "";
  const notes = keywords ? ` Seller notes: ${keywords}.` : "";

  return {
    description:
      `${cleanName} is a versatile ${category || "fashion"} item${
        subCategory ? ` in the ${subCategory.toLowerCase()} range` : ""
      }, designed for customers who want comfort, easy styling, and dependable everyday wear.${notes}${priceText}\n\nIts clean look makes it simple to pair with different outfits, while the product details help it stand out in search for shoppers browsing quality ${
        category || "fashion"
      } pieces.${sizeText}`,
    highlights: [
      "Comfort-focused everyday design",
      "SEO-friendly product copy",
      "Easy to style for multiple occasions",
    ],
  };
};

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const generateAIResponse = async (prompt) => {
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.log("Groq Error:", error.message);
    return null;
  }
};


export const summarizeReviews = async (reviews) => {
  try {
    if (!reviews || reviews.length === 0) return null;

    const reviewList = reviews
      .map((review, index) => {
        return `Review ${index + 1} (${review.rating}/5 stars): ${review.comment}`;
      })
      .join("\n");

    const prompt = `You are a helpful product review analyzer. Summarize customer reviews for an e-commerce product.

Reviews:
${reviewList}

Respond ONLY with valid JSON:
{
  "summary": "A concise 2-3 sentence overall summary",
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"]
}`;

    const text = await generateAIResponse(prompt);
    if (!text) {
      const positive = reviews.filter((review) => Number(review.rating) >= 4);
      const critical = reviews.filter((review) => Number(review.rating) <= 3);
      return {
        summary: `Customers left ${reviews.length} written reviews. ${
          positive.length >= critical.length
            ? "Overall feedback is positive, with shoppers highlighting useful qualities and a good buying experience."
            : "Feedback is mixed, with some shoppers raising concerns future buyers should consider."
        }`,
        pros: positive
          .filter((review) => review.comment)
          .slice(0, 3)
          .map((review) => review.comment.split(".")[0].slice(0, 90)),
        cons: critical
          .filter((review) => review.comment)
          .slice(0, 2)
          .map((review) => review.comment.split(".")[0].slice(0, 90)),
      };
    }

    let parsed = null;

try {
  parsed = parseJsonFromText(text);
} catch (e) {
  console.log("JSON Parse Failed");
  console.log(text);

return {
  reply:
    "AI service temporarily unavailable. Please try again later.",
  suggestedProducts: [],
};}
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

export const rankProductByRelevance = async (query, products) => {
  try {
    if (!Array.isArray(products) || products.length === 0) return null;

    const productList = products
      .map((product, index) => {
        return `Product ${index + 1}: ID ${product.id}, ${product.name}, ${product.category}/${product.sub_category || product.subCategory}, $${product.price}. ${product.description?.substring(0, 120) || ""}`;
      })
      .join("\n");

    const prompt = `You are an e-commerce semantic search ranking engine.
Customer query: "${query}"

Candidate products:
${productList}

Understand intent, style, price preference, category, and use-case. Return ONLY a JSON array of product numbers ordered by relevance. Exclude completely irrelevant products.
Example: [3, 1, 2]`;

    const text = await generateAIResponse(prompt);
    if (!text) return null;

    const parsed = parseJsonFromText(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.log("Product ranking error:", error.message);
    return null;
  }
};

export const generateProductDescription = async (productInfo) => {
  try {
    const { name, category, subCategory, sizes, price, keywords } = productInfo;

    const prompt = `You are an expert e-commerce copywriter and SEO specialist.

Create marketing-ready product copy from these seller inputs:
- Name: ${name}
- Category: ${category}
- Sub-category: ${subCategory || "Not specified"}
- Price: ${price || "Not specified"}
- Sizes: ${Array.isArray(sizes) ? sizes.join(", ") : sizes || "Not specified"}
- Seller notes/features: ${keywords || "Not specified"}

Write a professional description for shoppers, with natural SEO keywords. Use a confident, polished tone.

Respond ONLY with valid JSON:
{
  "description": "2 short paragraphs of professional marketing and SEO-friendly copy",
  "highlights": ["key feature 1", "key feature 2", "key feature 3"]
}`;

    const text = await generateAIResponse(prompt);
    if (!text) return localProductDescription(productInfo);

    const parsed = parseJsonFromText(text);
    return {
      description: parsed.description || "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    };
  } catch (error) {
    console.log("Product description generation error:", error.message);
    return localProductDescription(productInfo);
  }
};

export const regenerateProductDescription = async (
  productInfo,
  currentDescription,
  instruction,
) => {
  try {
    const { name, category } = productInfo;

    const prompt = `You are an expert e-commerce copywriter.
Current product description for "${name}" (${category}):
"${currentDescription}"

Seller instruction: ${instruction}

Rewrite it professionally and keep it SEO-friendly.

Respond ONLY with valid JSON:
{
  "description": "rewritten product description",
  "highlights": ["key feature 1", "key feature 2", "key feature 3"]
}`;

    const text = await generateAIResponse(prompt);
    if (!text) return localProductDescription({ ...productInfo, keywords: instruction });

    const parsed = parseJsonFromText(text);
    return {
      description: parsed.description || "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    };
  } catch (error) {
    console.log("Product description regeneration error:", error.message);
    return localProductDescription({ ...productInfo, keywords: instruction });
  }
};

const getLocalChatResponse = (userMessage, products) => {
  const intent = getSearchIntent(userMessage);
  const scored = products
    .map((product) => ({
      ...product,
      _score: scoreProductForIntent(product, intent),
    }))
    .filter((product) => product._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  if (scored.length > 0) {
    const names = scored.map((product) => product.name).join(", ");
    return {
      reply: `I found ${scored.length} product${scored.length === 1 ? "" : "s"} that match your request: ${names}. Open any suggestion below to view details.`,
      suggestedProducts: scored.map((product) => String(product.id)),
    };
  }

  return {
    reply:
      "I can help you search by style, category, price, or product name. Try something like 'cheap modern hoodie', 'women winter jacket under 80', or 'cotton topwear'.",
    suggestedProducts: [],
  };
};

export const chatWithContext = async (
  userMessage,
  conversationHistory,
  products = [],
) => {
  try {
    // const productContext = products
    //   .slice(0, 20)
    //   .map((product) => {
    //     return `ID: ${product.id}; Name: ${product.name}; Category: ${product.category}/${product.sub_category || product.subCategory}; Price: $${product.price}; Description: ${product.description?.substring(0, 160) || ""}`;
    //   })
    //   .join("\n");
    const productContext = JSON.stringify(products.slice(0, 20), null, 2);

    const historyText =
      conversationHistory && conversationHistory.length > 0
        ? conversationHistory.map((message) => `${message.role}: ${message.content}`).join("\n")
        : "No previous messages.";

    const prompt = `You are a helpful shopping assistant for a multi-vendor e-commerce store.

Available product context:
${productContext || "No products loaded."}

Conversation:
${historyText}

Customer: ${userMessage}

Instructions:
- Understand intent, style, category, and price preference.
- Recommend only products from the product context.
- If no exact match exists, suggest the closest useful products and explain briefly.
- Keep the reply concise.

Respond ONLY with valid JSON:
{
  "reply": "assistant reply",
  "suggestedProducts": ["product_id_1", "product_id_2"]
}`;

    const text = await generateAIResponse(prompt);
    if (text) {
      try {
        const parsed = parseJsonFromText(text);
        return {
          reply: parsed.reply || "I found a few options you may like.",
          suggestedProducts: Array.isArray(parsed.suggestedProducts)
            ? parsed.suggestedProducts.map(String)
            : [],
        };
      } catch (error) {
        console.log("AI returned unparsable chat JSON:", error.message);
      }
    }

    return getLocalChatResponse(userMessage, products);
  } catch (error) {
    console.log("Chat with context error:", error.message);
    return {
      reply: "Sorry, I couldn't process that. Please try again.",
      suggestedProducts: [],
    };
  }
};
