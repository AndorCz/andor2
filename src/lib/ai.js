import { supabase, handleError } from '@lib/database-browser'
import { isFilledArray } from '@lib/utils'

export async function gatherCodex (gameId) {
  const { data: codexSections, error: sectionsError } = await supabase.from('codex_sections').select('*').eq('game', gameId)
  if (sectionsError) { return handleError(sectionsError) }

  const { data: codexPages, error: pagesError } = await supabase.from('codex_pages').select('*').eq('game', gameId)
  if (pagesError) { return handleError(pagesError) }

  // Aggregate the codex data into a single string, with pages grouped into sections
  let codexString = '<h1>Informace o hře</h1>\n'

  // Find codex page without codex section
  const introPage = codexPages.find(page => !page.section)
  if (introPage?.content) {
    codexString += '<h2>Úvod</h2>\n'
    codexString += `<p>${introPage.content}</p>\n`
  }

  if (isFilledArray(codexSections)) {
    codexSections.forEach(section => {
      const sectionPages = codexPages.filter(page => page.section === section.id)
      if (sectionPages.length > 0) {
        codexString += `<h2>${section.name}</h2>\n`
        if (section.content) {
          codexString += `<p>${section.content}</p>\n`
        }
        sectionPages.forEach(page => {
          codexString += `<h3>${page.name}</h3>\n`
          codexString += `<p>${page.content}</p>\n`
        })
      }
    })
  }
  return codexString !== '<h1>Informace o hře</h1>\n' ? codexString : '' // Return empty string if no codex data
}

// Converts a File object to a GoogleGenerativeAI.Part object
export async function fileToGenerativePart (file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  })
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
  }
}
