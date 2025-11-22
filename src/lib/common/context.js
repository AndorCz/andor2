import { isFilledArray } from '@lib/utils'
import { gameSystems } from '@lib/constants'

export async function gatherCodex (supabase, gameId) {
  const { data: codexSections, error: sectionsError } = await supabase.from('codex_sections').select('*').eq('game', gameId)
  if (sectionsError) { throw new Error(sectionsError) }

  const { data: codexPages, error: pagesError } = await supabase.from('codex_pages').select('*').eq('game', gameId)
  if (pagesError) { throw new Error(pagesError) }

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

export function gatherCharacter (char, role) {
  return `### ${char.name}
Popis: ${char.bio || 'Žádný popis'}
${role === 'storyteller' && char.storyteller_notes ? `Poznámky vypravěče: ${char.storyteller_notes}` : ''}
`
}

// todo: add maps
export async function gatherGameInfo (supabase, game, role) {
  const customFonts = [...game.fonts, 'Lucida Handwriting', 'Caveat', 'Orbitron']
  return `# Název hry: ${game.name}
Anotace: ${game.annotation || 'Žádná anotace'}
Kategorie: ${game.category}
TTRPG systém: ${gameSystems.find(system => system.value === game.system)?.label || 'Bez systému'}
Dostupné custom fonty: ${customFonts.join(', ')}

## Popis hry
${await gatherCodex(supabase, game.id)}

## Hráčské postavy ve hře
${game.characters.map(char => gatherCharacter(char, role)).join('\n')}
`
}

export function formPost (post) {
  let content = ''
  if (post.audience_names && post.audience_names.length > 0) {
    content += `--- soukromý příspěvek pro: ${post.audience_names.join(', ')} ---\n`
  }
  content += post.content
  return content
}
