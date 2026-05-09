import { generateProductDescription, regenerateProductDescription } from "../services/aiService.js";

const generateDescription = async (req, res) => {
    try {
        const { name, category, subCategory, sizes, price, keywords } = req.body;

        if (!name || !category) {
            return res.status(400).json({ success: false, message: "name and category are required" });
        }

        const result = await generateProductDescription({ name, category, subCategory, sizes, price, keywords });

        if (!result) {
            return res.status(503).json({ success: false, message: "AI service unavailable, please try again" });
        }

        res.status(200).json({
            success: true,
            description: result.description,
            highlights: result.highlights,
        });
    } catch (error) {
        console.log("Product description generation error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const regenerateDescription = async (req, res) => {
    try {
        const { name, category, currentDescription, instruction } = req.body;

        if (!name || !currentDescription || !instruction) {
            return res.status(400).json({
                success: false,
                message: "name, currentDescription, and instruction are required",
            });
        }

        const result = await regenerateProductDescription(
            { name, category },
            currentDescription,
            instruction
        );

        if (!result) {
            return res.status(503).json({ success: false, message: "AI service unavailable, please try again" });
        }

        res.status(200).json({
            success: true,
            description: result.description,
            highlights: result.highlights,
        });
    } catch (error) {
        console.log("Product description regeneration error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { generateDescription, regenerateDescription };