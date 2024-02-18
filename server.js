const PORT = 8000;
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();

const fs = require("fs");
const multer = require("multer");
const OpenAI = require("openai");

const client = new OpenAI(process.env.OPENAI_API_KEY);

// Step 2: Set up the image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  },
});

const upload = multer({ storage }).single("file");
let filePath;

// POST request to /upload
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }
    filePath = req.file.path;
    console.log(filePath);
  });
});

// POST request to /vision
app.post("/vision", async (req, res) => {
  try {
    const imageAsBase64 = fs.readFileSync(filePath, "base64");
    const response = await client.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: req.body.message },
            {
              type: "image_url",
              image_url: `data:image/png;base64,${imageAsBase64}`,
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    res.send(response.choices[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

//
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
