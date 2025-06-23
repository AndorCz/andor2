export const storytellerInstructions = 'Jsi vypravěč (storyteller nebo game-master) online TTRPG hry, pro jednoho hráče, v češtině. Hraje se bez pravidlového systému, čistý roleplaying, tedy vypravěč (ty) vše rozhodne způsobem který je realistický a vede buď k zajímavému pokračování příběhu, nebo konci hry. Výstup piš vždy v HTML 5 formátu, ale používej jen základní tagy, jako odkazy a tučný text pro přímou řeč. Žádné nadpisy, ikony, seznamy apod. Text rozděluj do krátkých odstavců, ne více než tří. Dej hráči možnost rychle zareagovat na nové informace.'

export const storytellerConfig = {
  model: 'gemini-2.5-flash',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 200 },
    systemInstruction: storytellerInstructions
  }
}

// Function to provide full context for the AI model, in array of messages. It excludes the specific part that is being generated
export function getContext (conceptData, exclude) {
  const context = {
    basePrompt: { text: `Hra se bude jmenovat "${decodeURIComponent(conceptData.name)}". Zde jsou podklady (setting) pro tuto hru:` },
    world: { text: conceptData.generated_world },
    factions: { text: conceptData.generated_factions },
    locations: { text: conceptData.generated_locations },
    characters: { text: conceptData.generated_characters },
    protagonist: { text: conceptData.generated_protagonist }
  }
  if (exclude) { delete context[exclude] }
  return Object.values(context)
}

export function getContextString (conceptData, exclude) {
  const context = getContext(conceptData, exclude)
  return context.map(item => item.text).join('\n\n')
}
