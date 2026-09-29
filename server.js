import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;

const MODEL =
  process.env.OPENAI_MODEL || "gpt-6-luna";

const API_KEY =
  process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set."
  );
}

const openai =
  API_KEY
    ? new OpenAI({
        apiKey: API_KEY
      })
    : null;


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(cors());

app.use(
  express.json({
    limit: "12mb"
  })
);


/* =========================================================
   PATH
   ========================================================= */

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(value) {
  return String(
    value ?? ""
  ).trim();
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok: true,

      service:
        "fateh27-backend",

      model:
        MODEL,

      openaiConfigured:
        Boolean(API_KEY)

    });

  }
);


/* =========================================================
   FATEH27
   PYQ ENGLISH → HINDI TRANSLATION
   ========================================================= */

app.post(
  "/api/translate",
  async (req, res) => {

    try {

      /* -----------------------------------------------
         API KEY CHECK
         ----------------------------------------------- */

      if (!openai) {

        return res.status(500).json({

          error:
            "OPENAI_API_KEY is not configured."

        });

      }


      /* -----------------------------------------------
         INPUT
         ----------------------------------------------- */

      const text =
        cleanText(
          req.body?.text
        );

      const source =
        cleanText(
          req.body?.source || "en"
        );

      const target =
        cleanText(
          req.body?.target || "hi"
        );


      /* -----------------------------------------------
         VALIDATION
         ----------------------------------------------- */

      if (!text) {

        return res.status(400).json({

          error:
            "text is required"

        });

      }


      if (text.length > 12000) {

        return res.status(400).json({

          error:
            "text is too long"

        });

      }


      if (
        source !== "en" ||
        target !== "hi"
      ) {

        return res.status(400).json({

          error:
            "Only English to Hindi translation is enabled."

        });

      }


      /* -----------------------------------------------
         OPENAI TRANSLATION
         ----------------------------------------------- */

      const response =
        await openai.responses.create({

          model:
            MODEL,

          input: [

            {
              role:
                "system",

              content: [

                {

                  type:
                    "input_text",

                  text:
                    `
You are an expert UPSC bilingual editor.

Translate the supplied UPSC Civil Services Examination
question from English to natural, precise Hindi.

STRICT RULES:

1. Preserve the exact meaning.
2. Preserve the exact demand of the question.
3. Preserve directive words such as:
   Discuss, Examine, Analyse, Evaluate,
   Critically Examine, Assess, Comment,
   Explain, Compare, Differentiate, etc.
4. Do not summarize.
5. Do not explain.
6. Do not answer the question.
7. Do not add facts.
8. Do not remove information.
9. Preserve names, dates, places and institutions.
10. Preserve constitutional/legal terminology.
11. Preserve technical terminology.
12. Preserve numbering and structure.
13. Use natural UPSC-level Hindi.
14. Where useful, retain standard English terms
    in parentheses.

Examples:

Discuss
→ विवेचना कीजिए

Examine
→ परीक्षण कीजिए

Analyse
→ विश्लेषण कीजिए

Critically Examine
→ आलोचनात्मक परीक्षण कीजिए

Evaluate
→ मूल्यांकन कीजिए

Assess
→ आकलन कीजिए

Comment
→ टिप्पणी कीजिए

Explain
→ स्पष्ट कीजिए

Compare
→ तुलना कीजिए

Differentiate
→ अंतर स्पष्ट कीजिए

Output ONLY the Hindi translation.
                    `.trim()

                }

              ]

            },


            {
              role:
                "user",

              content: [

                {

                  type:
                    "input_text",

                  text:
                    text

                }

              ]

            }

          ]

        });


      /* -----------------------------------------------
         OUTPUT
         ----------------------------------------------- */

      const translation =
        cleanText(
          response.output_text
        );


      if (!translation) {

        return res.status(502).json({

          error:
            "Translation returned empty output."

        });

      }


      res.json({

        translation:
          translation

      });


    } catch (error) {

      console.error(
        "/api/translate error:",
        error
      );


      res.status(500).json({

        error:
          "Translation failed",

        detail:
          error?.message ||
          "Unknown error"

      });

    }

  }
);


/* =========================================================
   FATEH27
   AI ANSWER EVALUATION
   ========================================================= */

app.post(
  "/api/evaluate",
  async (req, res) => {

    try {

      /* -----------------------------------------------
         API KEY CHECK
         ----------------------------------------------- */

      if (!openai) {

        return res.status(500).json({

          error:
            "OPENAI_API_KEY is not configured."

        });

      }


      /* -----------------------------------------------
         INPUT
         ----------------------------------------------- */

      const {

        exam =
          "UPSC CSE",

        paper =
          "GS2",

        marks =
          10,

        question =
          "",

        answer =
          "",

        image =
          null,

        language =
          "English"

      } =
        req.body || {};


      /* -----------------------------------------------
         VALIDATION
         ----------------------------------------------- */

      if (
        !cleanText(question)
      ) {

        return res.status(400).json({

          error:
            "question is required"

        });

      }


      if (
        !cleanText(answer) &&
        !image
      ) {

        return res.status(400).json({

          error:
            "answer or image is required"

        });

      }


      /* -----------------------------------------------
         SYSTEM PROMPT
         ----------------------------------------------- */

      const systemPrompt = `

You are an expert UPSC Civil Services
Mains evaluator.

Evaluate the candidate answer strictly
according to UPSC-style expectations.

Do not invent facts.

If an image is supplied,
read the handwriting carefully.

Return ONLY valid JSON matching
the supplied schema.

Use ${language} for the feedback
where practical.

Paper:
${paper}

Marks:
${marks}

Exam:
${exam}

Evaluate:

1. Question demand
2. Content accuracy
3. Demand coverage
4. Structure
5. Dimensions
6. Examples
7. Data
8. Conceptual clarity
9. Introduction
10. Conclusion
11. Presentation
12. Overall UPSC suitability

Give actionable improvements.

`.trim();


      /* -----------------------------------------------
         USER PROMPT
         ----------------------------------------------- */

      const userText = `

QUESTION:

${question}


CANDIDATE ANSWER:

${
  answer ||
  "[Answer supplied as handwritten image]"
}


Evaluate the answer carefully.

Give:

• likely marks
• demand coverage
• strengths
• weaknesses
• missing points
• structure feedback
• factual accuracy
• examples/data assessment
• introduction feedback
• conclusion feedback
• improvement plan
• model answer skeleton
• examiner note

`.trim();


      /* -----------------------------------------------
         CONTENT
         ----------------------------------------------- */

      const content = [

        {

          type:
            "input_text",

          text:
            userText

        }

      ];


      /* -----------------------------------------------
         HANDWRITTEN IMAGE
         ----------------------------------------------- */

      if (image) {

        content.push({

          type:
            "input_image",

          image_url:
            image

        });

      }


      /* -----------------------------------------------
         OPENAI EVALUATION
         ----------------------------------------------- */

      const response =
        await openai.responses.create({

          model:
            MODEL,

          input: [

            {

              role:
                "system",

              content: [

                {

                  type:
                    "input_text",

                  text:
                    systemPrompt

                }

              ]

            },


            {

              role:
                "user",

              content:
                content

            }

          ],


          text: {

            format: {

              type:
                "json_schema",

              name:
                "upsc_answer_evaluation",

              strict:
                true,

              schema: {

                type:
                  "object",

                additionalProperties:
                  false,


                properties: {

                  score: {

                    type:
                      "number"

                  },


                  max_score: {

                    type:
                      "number"

                  },


                  verdict: {

                    type:
                      "string"

                  },


                  demand_coverage: {

                    type:
                      "string"

                  },


                  strengths: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  weaknesses: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  missing_points: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  structure_feedback: {

                    type:
                      "string"

                  },


                  factual_accuracy: {

                    type:
                      "string"

                  },


                  examples_data: {

                    type:
                      "string"

                  },


                  introduction_feedback: {

                    type:
                      "string"

                  },


                  conclusion_feedback: {

                    type:
                      "string"

                  },


                  improvement_plan: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  model_answer_skeleton: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  examiner_note: {

                    type:
                      "string"

                  }

                },


                required: [

                  "score",

                  "max_score",

                  "verdict",

                  "demand_coverage",

                  "strengths",

                  "weaknesses",

                  "missing_points",

                  "structure_feedback",

                  "factual_accuracy",

                  "examples_data",

                  "introduction_feedback",

                  "conclusion_feedback",

                  "improvement_plan",

                  "model_answer_skeleton",

                  "examiner_note"

                ]

              }

            }

          }

        });


      /* -----------------------------------------------
         PARSE RESULT
         ----------------------------------------------- */

      let result;


      try {

        result =
          JSON.parse(
            response.output_text
          );

      } catch {

        return res.status(502).json({

          error:
            "Evaluator returned invalid JSON.",

          raw:
            response.output_text

        });

      }


      /* -----------------------------------------------
         SEND RESULT
         ----------------------------------------------- */

      res.json(
        result
      );


    } catch (error) {

      console.error(
        "/api/evaluate error:",
        error
      );


      res.status(500).json({

        error:
          "Evaluation failed",

        detail:
          error?.message ||
          "Unknown error"

      });

    }

  }
);


/* =========================================================
   STATIC FRONTEND
   ========================================================= */

app.use(
  express.static(
    __dirname
  )
);


/* =========================================================
   SPA FALLBACK
   ========================================================= */

app.get(
  "*",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


/* =========================================================
   SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `FATEH27 backend running on port ${PORT}`
    );

  }
);
