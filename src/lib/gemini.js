/*
import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGemini () {
  // console.log('key', import.meta.env.GOOGLE_GEMINI)
  // const gemini = new GoogleGenerativeAI(import.meta.env.GOOGLE_GEMINI)
  // const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
  // return { gemini, model }
}

export async function generateStory (model, prompt) {
  const result = await model.generateContentStream(prompt)
  let response = ''

  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    console.log(chunkText)
    response += chunkText
  }
}
*/
