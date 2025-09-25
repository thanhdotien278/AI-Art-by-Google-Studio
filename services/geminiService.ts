import { GoogleGenAI, Modality, Type } from "@google/genai";
import { FormData, ImageFile, GeneratedImageData, GeneratedVideoData, Gender } from '../types';
import { logToSheet } from './loggingService';
import { getSecurePrompt } from './gatekeeperService';


export const analyzeImageAndExtractDetails = async (imageFile: ImageFile, language: 'vi' | 'en'): Promise<Partial<FormData>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    const outputLanguage = language === 'vi' ? 'Vietnamese' : 'English';

    const prompt = `
    # PRIMARY ROLE
    You are an Expert Image Description Builder for an AI image generation system. Your task is to analyze the provided image and transform it into a structured JSON object containing hyper-detailed, vivid descriptions. These details will be used to generate an 8K hyper-realistic photograph.

    # PROCESSING & DESCRIPTION GENERATION RULES

    1.  **Analyze Gender:** Strictly identify the gender of the main subject. The output must be either "Nam" (Male) or "Nữ" (Female).

    2.  **Auto-fill Creatively:** If any field (except gender) is unclear, you must creatively and logically fill it in based on the available visual information. Ensure consistency across all fields.

    3.  **Detailed Character Description:**
        *   **Theme/Role:** Define the character's role or the overall theme.
        *   **Action:** Describe their posture and interaction with the environment.
        *   **Emotion:** Describe their facial expression specifically.

    4.  **DISTINGUISH LOCATION vs. CONTEXT:**
        *   **\`location\` (Specific Landmark):** Your primary goal here is to identify if the image contains a SPECIFIC, REAL-WORLD, FAMOUS LANDMARK (e.g., "Eiffel Tower, Paris," "Ben Thanh Market, Ho Chi Minh City," "Dragon Bridge, Da Nang"). If no specific, famous landmark is clearly identifiable, you MUST return an EMPTY STRING "" for this field. Do not guess.
        *   **\`context\` (General Scene):** This is for the GENERAL scene description. Even if a landmark is identified, describe the surrounding environment here. Paint a complete picture with depth, texture, and atmosphere. Describe architecture, nature, light, shadow, textures, and mood. For example, if the location is "Ben Thanh Market," the context could be "bustling street scene at night, with vibrant neon lights reflecting on wet pavement, food stalls steaming in the foreground."

    5.  **Output Language**: All your text descriptions (theme, context, location, action, emotion, style) MUST be in ${outputLanguage}.

    # OUTPUT
    Your output MUST BE a single, valid JSON object with the following keys. Do NOT include any other text, markdown, or explanations outside of the JSON object.
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageFile.base64,
                        mimeType: imageFile.mimeType,
                    },
                },
                { text: prompt },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    gender: { 
                        type: Type.STRING,
                        description: 'The gender of the main character. Must be either "Nam" for Male or "Nữ" for Female.',
                        enum: ['Nam', 'Nữ']
                    },
                    theme: { 
                        type: Type.STRING,
                        description: "The character's main theme or role (e.g., a cyberpunk warrior, a peaceful traveler)."
                    },
                    context: { 
                        type: Type.STRING,
                        description: "A hyper-detailed description of the general scene, including lighting, textures, and atmosphere."
                    },
                    location: {
                        type: Type.STRING,
                        description: "A specific, real-world, famous landmark, IF identifiable. Otherwise, this must be an empty string."
                    },
                    action: { 
                        type: Type.STRING,
                        description: "The character's specific action and pose (e.g., looking thoughtfully into the distance, running through a neon-lit alley)."
                    },
                    emotion: { 
                        type: Type.STRING,
                        description: "The specific emotion expressed on the character's face (e.g., pensive, determined, joyful)."
                    },
                    style: { 
                        type: Type.STRING,
                        description: "The overall artistic or photographic style of the image (e.g., cinematic, warm tones, black and white, haunting)."
                    },
                },
                required: ['gender', 'theme', 'context', 'location', 'action', 'emotion', 'style']
            },
        },
    });

    const jsonString = response.text.trim();
    try {
        const result = JSON.parse(jsonString);
        // Ensure location is not null/undefined before returning
        result.location = result.location || "";
        return result;
    } catch (e) {
        console.error("Failed to parse JSON from model response:", jsonString);
        throw new Error("Model returned invalid JSON.");
    }
};

export const rewriteContextForGender = async (
  originalContext: Partial<FormData>, 
  targetGender: Gender, 
  language: 'vi' | 'en'
): Promise<Partial<FormData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const outputLanguage = language === 'vi' ? 'Vietnamese' : 'English';
  const originalGender = originalContext.gender;

  const prompt = `
  # PRIMARY ROLE
  You are an expert text editor specializing in adapting scene descriptions. Your task is to take the provided JSON object describing a scene and rewrite its text fields to change the subject's gender from "${originalGender}" to "${targetGender}".

  # REWRITING RULES
  1.  **Update Gender Field:** The \`gender\` field in the output JSON MUST be updated to "${targetGender}".
  2.  **Grammatical Changes:** Make all necessary grammatical changes. This includes pronouns (e.g., he -> she, his -> her) and gendered nouns (e.g., man -> woman, actor -> actress).
  3.  **Contextual Adaptation:** Subtly adapt descriptions of clothing, actions, or roles to be natural and appropriate for the new gender, while preserving the original theme, mood, and core elements of the scene. For instance, "a rugged man's leather jacket" might become "a stylish woman's leather jacket." The goal is a natural-sounding description, not a caricature.
  4.  **Preserve Structure:** The output must be a valid JSON object with the exact same keys as the input. Do not add, remove, or change the key names.
  5.  **Output Language**: All text descriptions MUST be in ${outputLanguage}.

  # INPUT DATA
  Here is the JSON object to rewrite:
  ${JSON.stringify(originalContext, null, 2)}

  # OUTPUT
  Your output MUST BE a single, valid JSON object containing the rewritten data. Do not include any other text, markdown, or explanations.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
          type: Type.OBJECT,
          properties: {
              gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
              theme: { type: Type.STRING },
              context: { type: Type.STRING },
              location: { type: Type.STRING },
              action: { type: Type.STRING },
              emotion: { type: Type.STRING },
              style: { type: Type.STRING },
          },
          required: ['gender', 'theme', 'context', 'location', 'action', 'emotion', 'style']
      },
    },
  });

  const jsonString = response.text.trim();
  try {
    const result = JSON.parse(jsonString);
    return result;
  } catch (e) {
    console.error("Failed to parse JSON from gender swap response:", jsonString);
    throw new Error("Model returned invalid JSON for gender swap.");
  }
};


export const generateEnhancedPrompt = async (formData: FormData, language: 'vi' | 'en'): Promise<string> => {
    // Fetch the prompt securely from the gatekeeper backend
    // The hasReferenceImage flag doesn't significantly change the prompt text structure for the initial generation,
    // so passing false here is acceptable. The main goal is to get the editable prompt structure.
    const { prompt } = await getSecurePrompt(formData, false, language);
    return prompt;
};


export const generateCompositedImage = async (
    formData: FormData, 
    faceImageFile: ImageFile,
    referenceImageFile: ImageFile | null,
    language: 'vi' | 'en',
    overridePrompt: string | null = null
): Promise<GeneratedImageData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt: string;
  let techDetails: string;

  if (overridePrompt) {
      prompt = overridePrompt;
      techDetails = language === 'vi' ? "Tạo từ prompt tùy chỉnh" : "Generated from custom prompt";
  } else {
      // Fetch the prompt securely from the gatekeeper backend
      const result = await getSecurePrompt(formData, !!referenceImageFile, language);
      prompt = result.prompt;
      techDetails = result.techDetails;
  }

  const model = 'gemini-2.5-flash-image-preview';

  const imageParts = [
    {
      inlineData: {
        data: faceImageFile.base64,
        mimeType: faceImageFile.mimeType,
      },
    },
  ];

  if (referenceImageFile) {
    imageParts.push({
      inlineData: {
        data: referenceImageFile.base64,
        mimeType: referenceImageFile.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        ...imageParts,
        {
          text: prompt,
        },
      ],
    },
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("Không nhận được phản hồi hợp lệ từ mô hình.");
  }
  
  const imagePart = response.candidates[0].content.parts.find(part => part.inlineData);

  if (imagePart && imagePart.inlineData) {
     const base64ImageBytes: string = imagePart.inlineData.data;
     const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
     
     // Log the usage count without any detailed data
     logToSheet({ type: 'Image' });

     return { imageUrl, techDetails };
  }
  
  throw new Error("Mô hình không trả về hình ảnh.");
};

export const processVideoRequest = async (
    requestText: string,
    gender: Gender,
    faceImage: ImageFile
): Promise<{ suggestions?: string[]; prompt?: string; techDetails?: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';

    const prompt = `
# PRIMARY ROLE
You are a world-class AI Video Prompt Expert, specializing in creating detailed, technical prompts for hyper-realistic video generation. Your ultimate mission is to take a user's reference face image and scene request, then compose a FULL TEXT PROMPT to instruct another AI video model to produce a HYPER-REALISTIC, CINEMATIC DOCUMENTARY STYLE video where the character's face is flawlessly and consistently composited onto EVERY FRAME of the video.

# CORE, NON-NEGOTIABLE DIRECTIVES
1.  **MANDATORY FACE COMPOSITING ACROSS ALL FRAMES:** Every video prompt you generate MUST begin with this CORE FACE COMPOSITING INSTRUCTION: \`[CORE DIRECTIVE FOR VIDEO FACE COMPOSITING: The primary goal is to seamlessly and artistically composite the face from the user's reference image onto the character, maintaining strong consistency in EVERY FRAME. Faithfully represent the key facial features, expression, and head angle from the reference photo throughout the video. The lighting on the character and environment should be harmonized to match the lighting on the reference face, creating a natural and believable result. Ensure the character's proportions are realistic and consistent in motion.]\`
2.  **DEFAULT VIDEO STYLE & QUALITY:** Following the face compositing instruction, the video prompt must always start with: \`PRODUCE A HYPER-REALISTIC, CINEMATIC DOCUMENTARY STYLE VIDEO CLIP.\`
3.  **DYNAMIC TEXTURE EMPHASIS:** The prompt must always include the instruction \`EXTREME EMPHASIS on HYPER-REALISTIC, FILM-QUALITY, DYNAMIC TEXTURES for all moving surfaces, clothing, skin, hair, and objects.\`

# USER INPUT ANALYSIS & WORKFLOW
You will receive a user's text request and a reference image of a character.

1.  **ANALYZE REFERENCE IMAGE:** First, analyze the provided reference image to understand the character's appearance (e.g., clothing, style), expression (e.g., happy, serious), and any potential context (e.g., outdoors, formal setting).

2.  **PROCESS TEXT REQUEST:** The user's text request is: \`${requestText}\` for a character of gender: ${gender}.

3.  **EXECUTE TASK:**
    *   **IF THE TEXT REQUEST IS FOR SUGGESTIONS** (contains keywords like "suggest", "đề xuất", "gợi ý", "ý tưởng", or is a short phrase): The user has provided a base idea: \`${requestText}\`. Use this idea as the core theme. Based on this theme and your analysis of the reference image, generate 3 creative and expanded scene suggestions **in Vietnamese**. The suggestions should be more detailed and compelling variations of the user's initial idea. If the user's idea is very generic (like 'suggest scenes'), generate diverse ideas based on the reference image.
    *   **IF THE TEXT REQUEST IS A SCENE DESCRIPTION** (including a Vietnamese suggestion selected by the user): Use the user's description to construct a full, professional **English video prompt** following the structure below. The reference image's primary purpose, in this case, is for the face composite.

# PROFESSIONAL VIDEO PROMPT CONSTRUCTION (for specific scene requests)
Based on the user's request, create a detailed video prompt, storyboarded like a short film script.
*   **Structure:**
    *   Use scene blocks: \`[SCENE 1: DESCRIPTION]\`
        *   **\`CAMERA:\`** (Specify camera, lens, and precise movement, e.g., \`ARRI Alexa LF with an 85mm T1.5 Prime Lens, a smooth, low-angle tracking shot, slowly moving forward as the character walks.\`)
        *   **\`CHARACTER ACTION & EXPRESSION:\`** (Detail actions, facial expressions, body language, and interactions, e.g., \`A ${gender === 'Nam' ? 'man' : 'woman'} with the provided face is gracefully walking down a busy street, occasionally glancing at shop windows. His/Her expression is calm, with a slight, almost imperceptible smile. His/Her hair sways gently with each step.\`)
        *   **\`ENVIRONMENT & ATMOSPHERE:\`** (Describe the setting in detail, including dynamic lighting, atmosphere, and moving environmental elements, e.g., \`A bustling urban street during golden hour. Soft, warm sunlight bathes the scene, creating long shadows. Pedestrians blurred in the background. Leaves subtly rustling on nearby trees.\`)
        *   **\`LIGHTING & VFX (DYNAMIC):\`** (Detail light sources, intensity, color, direction, and dynamic effects, e.g., \`Dynamic interplay of warm golden hour sunbeams catching dust particles in the air, creating volumetric light rays. Soft, natural bounce light illuminating the character's face. Subtle lens flares.\`)
        *   **\`TEXTURES (DYNAMIC):\`** \`EXTREME EMPHASIS on HYPER-REALISTIC, FILM-QUALITY, DYNAMIC TEXTURES for moving clothing fabric, shimmering hair, detailed skin pores, and textured urban surfaces.\`

# OUTPUT STRUCTURE
Your output MUST be a single, valid JSON object. Do not include any other text or markdown.
*   **For Suggestions:** \`{"suggestions": ["Suggestion 1 in Vietnamese...", "Suggestion 2 in Vietnamese...", "Suggestion 3 in Vietnamese..."]}\`
*   **For Video Prompt:** \`{"prompt": "The full, detailed English video prompt text...", "techDetails": "A brief summary..."}\`
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: faceImage.base64,
                        mimeType: faceImage.mimeType,
                    },
                },
                { text: prompt },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        nullable: true
                    },
                    prompt: {
                        type: Type.STRING,
                        nullable: true
                    },
                    techDetails: {
                        type: Type.STRING,
                        nullable: true
                    }
                }
            }
        }
    });

    try {
        const result = JSON.parse(response.text.trim());
        if (result.suggestions && Array.isArray(result.suggestions)) {
            return { suggestions: result.suggestions };
        }
        if (result.prompt && result.techDetails) {
            return { prompt: result.prompt, techDetails: result.techDetails };
        }
        if (result.suggestions) {
             throw new Error("Model returned suggestions in an invalid format.");
        }
        throw new Error("Model response did not contain a valid prompt or suggestions.");
    } catch (e) {
        console.error("Failed to parse or validate video request response:", response.text, e);
        throw new Error("Model returned invalid data for video request.");
    }
};

export const generateVideoFromPrompt = async (
    prompt: string,
    faceImage: ImageFile,
    gender: Gender,
    requestText: string
): Promise<GeneratedVideoData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: faceImage.base64,
            mimeType: faceImage.mimeType,
        },
        config: {
            numberOfVideos: 1
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        // Fix: Cast error message to string to prevent crash on unknown type.
        const errorMessage = String(operation.error.message).toLowerCase();
        if (errorMessage.includes('safety') || errorMessage.includes('policy') || errorMessage.includes('blocked')) {
             throw new Error(`SAFETY_VIOLATION: ${operation.error.message}`);
        }
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video URI not found in the operation response.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video file. Status: ${videoResponse.status}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    // Log the usage count without any detailed data
    logToSheet({ type: 'Video' });
    
    const techDetails = "Generated with VEO 2.0 and Gemini 2.5 Flash";
    
    return { videoUrl, techDetails };
};