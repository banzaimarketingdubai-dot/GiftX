import { FunnelMessageDefinition, TONE_OF_VOICE } from './funnelContentPlan.js';

export interface GeneratedContentResult {
  text: string;
  imageUrl?: string;
  visualPrompt: string;
}

/**
 * AI Content Engine for synthesizing dynamic campaign copy using Gemini LLM
 * and preparing high-quality 3D visual assets matching visual prompts.
 */
export class AIContentEngine {
  private static geminiApiKey = process.env.GEMINI_API_KEY || '';
  private static geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  /**
   * Synthesize text copy using Gemini API based on topic, key points & Tone of Voice.
   */
  public static async generateMessageCopy(
    segment: 'B2C' | 'B2B',
    dayKey: string,
    msgDef: FunnelMessageDefinition
  ): Promise<string> {
    const toneRule = segment === 'B2C' ? TONE_OF_VOICE.B2C : TONE_OF_VOICE.B2B;
    const prompt = `
You are an expert copywriter for GiftX Vietnam (a gamified B2B2C cross-marketing platform in Telegram).

Topic: "${msgDef.topic}"
Key Points to cover: "${msgDef.points}"
${toneRule}

Requirements:
1. Write in Russian (or bilingual Russian/English if appropriate).
2. Keep it punchy, engaging, structured with bullet points and attractive emojis.
3. Length: 100-200 words. Include a strong Call to Action.
4. Do not include markdown headers like '# Topic'. Write directly as a Telegram message.
`.trim();

    if (this.geminiApiKey) {
      const candidateModels = Array.from(
        new Set([
          process.env.GEMINI_MODEL,
          'gemini-3.6-flash',
          'gemini-3.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash'
        ].filter(Boolean) as string[])
      );

      for (const modelName of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            }
          );

          if (response.ok) {
            const data = (await response.json()) as any;
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
              return generatedText.trim();
            }
          }
        } catch (err: any) {
          console.warn(`[AIContentEngine] Gemini model ${modelName} API error:`, err.message);
        }
      }
    }

    // Fallback Smart Synthesizer when GEMINI_API_KEY is not set or network fails
    return this.fallbackSynthesize(segment, msgDef);
  }

  /**
   * Fallback copy synthesizer matching exact ToneV specifications
   */
  private static fallbackSynthesize(
    segment: 'B2C' | 'B2B',
    msgDef: FunnelMessageDefinition
  ): string {
    if (segment === 'B2C') {
      return (
        `✨ **${msgDef.topic}**\n\n` +
        `🎁 ${msgDef.points}\n\n` +
        `⚡ *Получай еще больше подарков и сюрпризов от заведений города каждый день!*\n\n` +
        `Жми на кнопку ниже, чтобы открыть приложение GiftX! 🚀`
      );
    } else {
      return (
        `💼 **${msgDef.topic}**\n\n` +
        `📌 ${msgDef.points}\n\n` +
        `📈 *GiftX — это готовая экосистема без затрат на интеграцию. Растите ваш бизнес вместе с нами!*\n\n` +
        `Нажмите ниже, чтобы узнать больше или связаться с командой!`
      );
    }
  }

  /**
   * Generate or resolve 3D visual asset matching the prompt
   */
  public static async generateVisualAsset(visualPrompt: string): Promise<string> {
    // If an external Image Generation API key is set, call Imagen 3 / DALL-E / Midjourney webhook
    const imageGenApiKey = process.env.IMAGE_GEN_API_KEY;
    if (imageGenApiKey) {
      try {
        // Example call to external image generation API
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${imageGenApiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: visualPrompt,
            n: 1,
            size: '1024x1024'
          })
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          if (data?.data?.[0]?.url) {
            return data.data[0].url;
          }
        }
      } catch (err) {
        console.warn('[AIContentEngine] Image API call error:', err);
      }
    }

    // High quality 3D stylized placeholder image URL using visual prompt key
    const encodedPrompt = encodeURIComponent(visualPrompt.slice(0, 100));
    return `https://placehold.co/800x800/1a1a2e/ffd700/png?text=GiftX+3D+Render:\n${encodedPrompt}`;
  }

  /**
   * Complete workflow: Generate text + 3D image asset for a campaign message
   */
  public static async generateFullMessage(
    segment: 'B2C' | 'B2B',
    dayKey: string,
    msgDef: FunnelMessageDefinition
  ): Promise<GeneratedContentResult> {
    const text = await this.generateMessageCopy(segment, dayKey, msgDef);
    const imageUrl = await this.generateVisualAsset(msgDef.visual);

    return {
      text,
      imageUrl,
      visualPrompt: msgDef.visual
    };
  }
}
