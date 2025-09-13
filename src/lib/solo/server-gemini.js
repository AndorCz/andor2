import { GoogleGenAI } from '@google/genai'
import { illustrationStyleAffixes, storytellerInstructions, getResponseSchema } from '@lib/solo/solo'
import { soloTones } from '@lib/constants'

export const getStorytellerParams = (concept, history, npcSlugs, systemInstruction) => {
  const illustrationStyleAffix = illustrationStyleAffixes[concept.illustration_style] || 'ink'
  const responseSchema = getResponseSchema(illustrationStyleAffix)

  if (npcSlugs) { responseSchema.properties.character.properties.slug.enum = npcSlugs } // Update the enum with available NPC slugs
  if (!systemInstruction) {
    systemInstruction = storytellerInstructions
    const toneLabel = soloTones.find(t => t.value === concept.tone)?.label
    if (toneLabel && concept.tone !== 'neutral') {
      systemInstruction += ` Vyprávěj v žánru: ${toneLabel.toLowerCase()}.`
    }
  }

  return {
    model: 'gemini-2.5-pro',
    config: {
      safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
      thinkingConfig: { thinkingBudget: 200 },
      candidateCount: 1,
      responseMimeType: 'application/json',
      responseSchema,
      systemInstruction
    },
    history
  }
}

export function getAI (env) {
  if (!env.PRIVATE_GEMINI) { console.error('API key for Gemini is not set in environment variables') }
  return new GoogleGenAI({ apiKey: env.PRIVATE_GEMINI })
}

export function getChat (env, params) {
  const ai = getAI(env)
  return ai.chats.create(params)
}
