import { gatherGameInfo, gatherCharacter } from '@lib/common/context'

export async function getPostGenerationInstructions (supabase, data) {
  let instructions
  const gameInfo = await gatherGameInfo(supabase, data.game, data.role)
  const styleNotes = 'Používej jednoduché HTML značky pro stylování příspěvku. Používej uvozovky a tučné písmo pro zvýraznění přímé řeči. Používej kurzívu pro myšlenky postavy. Dodržuj tón a styl dle daného žánru hry. Příspěvek by neměl být příliš dlouhý, jeden až tři odstavce, podle potřeby děje.'
  if (data.role === 'storyteller') {
    // Storyteller
    instructions = `Jsi asistent vypravěče ve hře na hrdiny. Tvým úkolem je rozepsat vypravěčův vstupní text (prompt, označený jako "--- PROMPT VYPRAVĚČE ---") do plnohodnotného herního příspěvku.

## Styl výstupu
${styleNotes}
Pokud uvádíš novou scénu, můžeš použít nadpis a případně jeden z custom fontů dostupných ve hře (inline css font-family). Default je hezký font 'Alegreya', ideální pro fantasy a klasiku.

${gameInfo}

## Tajné poznámky vypravěče
${data.game.notes || 'Žádné poznámky'}
## Plán příběhu
${data.game.story || 'Žádný plán'}
`
  } else {
    // Player character - todo: Add portrait
    instructions = `Jsi asistent hráče ve hře na hrdiny. Tvým úkolem je rozepsat hráčův vstupní text (prompt, označený jako "--- PROMPT HRÁČE ---") do plnohodnotného herního příspěvku.

## Styl výstupu
${styleNotes}

${gameInfo}

## Popis tvé postavy
${gatherCharacter(data.character, data.role)}`
  }
  return instructions
}
