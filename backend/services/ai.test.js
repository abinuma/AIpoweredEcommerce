import { jest } from "@jest/globals";
import { generateAIResponse, chatWithContext } from "./aiService.js";

// Mock fetch globally
global.fetch = jest.fn();

describe("aiService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_URL = "https://api.gemini.test/generate";
  });

  describe("generateAIResponse", () => {
    test("should return text on successful Gemini response", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().resolveValue({
          candidates: [
            { content: { parts: [{ text: "Hello! How can I help?" }] } },
          ],
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await generateAIResponse("Hello");
      expect(result).toBe("Hello! How can I help?");
    });

    test("should log HTTP error and return null on non-OK response", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: jest.fn().resolveValue("Rate limit exceeded"),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await generateAIResponse("Hello");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Gemini API error: 429 Too Many Requests",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Gemini response body:",
        "Rate limit exceeded",
      );

      consoleSpy.mockRestore();
    });

    test("should log missing fields and return null", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const mockResponse = {
        ok: true,
        json: jest.fn().resolveValue({ candidates: [] }), // Missing structure
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await generateAIResponse("Hello");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gemini response missing expected candidates"),
      );

      consoleSpy.mockRestore();
    });

    test("should return null if GEMINI_API_KEY missing", async () => {
      delete process.env.GEMINI_API_KEY;
      const result = await generateAIResponse("Hello");
      expect(result).toBeNull();
    });

    test("should log stack trace on error", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const error = new Error("Network error");
      global.fetch.mockRejectedValue(error);

      const result = await generateAIResponse("Hello");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("AI Service error:"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("chatWithContext", () => {
    test("should return fallback with suggested products when Gemini fails", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: jest.fn().resolveValue("Internal error"),
      });

      const productContext = `Product 1 (ID: 101): Men Jacket - Blue wool jacket, Price: $120
Product 2 (ID: 102): Women Jacket - Red leather jacket, Price: $150`;

      const result = await chatWithContext(
        "Show me jackets",
        [],
        productContext,
      );

      expect(result).toBeDefined();
      expect(result.reply).toBeDefined(); // Should have fallback message
      expect(Array.isArray(result.suggestedProducts)).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
