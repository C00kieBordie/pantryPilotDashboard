const OpenAI = require("openai/index.js");
const multer = require("multer");
require("dotenv").config();

const storage = multer.memoryStorage();
exports.uploadMiddleware = multer({ storage: storage }).single("invoice_image");

// Initialize the client pointing to OpenRouter instead of OpenAI directly
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

exports.scanInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // Convert the image to base64 format for the API
    const base64Image = req.file.buffer.toString("base64");

    // 1. Intercept the mimetype. If it is generic data, force it to be a JPEG.
    const correctedMimeType =
      req.file.mimetype === "application/octet-stream"
        ? "image/jpeg"
        : req.file.mimetype;

    // 2. Use the corrected variable instead of req.file.mimetype
    const dataURI = `data:${correctedMimeType};base64,${base64Image}`;

    const prompt = `
            You are an expert data extraction assistant. Analyze this invoice/receipt image.
            Extract the individual items, their quantities, and their unit prices.
            Return strictly valid JSON with no markdown formatting, no backticks, and no extra text.
            Use this exact structure:
            {
                "vendor_name": "Name of the restaurant or supplier",
                "total_amount": 0.00,
                "items": [
                    {
                        "product_name": "Example Item",
                        "quantity": 1,
                        "unit_price": 5.00,
                        "total_price": 5.00
                    }
                ]
            }
        `;

    // We use gpt-4o-mini because it is insanely cheap and great at vision/JSON
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataURI } },
          ],
        },
      ],
    });

    let responseText = response.choices[0].message.content;
    responseText = responseText
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const parsedData = JSON.parse(responseText);

    return res.status(200).json({
      message: "Scan successful",
      data: parsedData,
    });
  } catch (error) {
    console.error("Scanner Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to process the invoice image." });
  }
};

// 4. The Expiry Date Scanner Function
exports.scanExpiry = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const base64Image = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

    // Specialized prompt for messy can bottoms and labels
    const prompt = `
            You are an expert OCR assistant. Analyze this image of a product package or the bottom of a can.
            Find the expiration date, "best by" date, "use by" date, or "sell by" date.
            
            CRITICAL RULES:
            1. Beware of dot-matrix printing. Look closely at blurry numbers.
            2. Ignore lot codes, barcodes, and timestamps (e.g., 14:22).
            3. If the date is formatted as DD/MM/YY vs MM/DD/YY, use your best judgment based on the numbers (e.g., 25/10/26 must be Oct 25th).
            4. Format strictly as YYYY-MM-DD. If the day is missing, use the LAST day of the month.
            
            Return strictly valid JSON:
            {
                "expiry_date": "YYYY-MM-DD"
            }
        `;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4oç",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataURI } },
          ],
        },
      ],
    });

    let responseText = response.choices[0].message.content;
    responseText = responseText
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const parsedData = JSON.parse(responseText);

    return res.status(200).json({
      message: "Expiry scan successful",
      data: parsedData,
    });
  } catch (error) {
    console.error("Expiry Scanner Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to process the expiry image." });
  }
};
