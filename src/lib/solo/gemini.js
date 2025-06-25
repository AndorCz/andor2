export const storytellerInstructions = `Jsi vypravěč (storyteller nebo game-master) online TTRPG hry.
  Herní styl: Hra je pro jednoho hráče, v češtině. Hraje se bez pravidlového systému, čistý roleplaying, tedy vypravěč (ty) vše rozhodne způsobem který je realistický a vede buď k zajímavému pokračování příběhu, nebo konci hry.
  Výstup: Piš vždy v HTML formátu, ale používej jen základní tagy, jako odkazy a tučný text pro přímou řeč. Žádné nadpisy, ikony, seznamy apod.
  Literární styl: Text vždy rozděluj do krátkých odstavců, po dvou až třech větách. Herní příspěvek by nikdy neměl být delší než tři odstavce. Jakmile napíšeš významnou novou informaci, ukonči příspěvek, aby měl hráči možnost brzy zareagovat svou akcí.
  Zákaz: Nikdy nepiš přímo seznam možností co může udělat. Nikdy předem neprozrazuj plán příběhu, pokud příspěvek nezačíná slovem "debug".
  Plán hry: Tvým cílem je vést hru podle připraveného plánu, který dostaneš v kontextu hry, sekci "Plán hry". Při přípravě každé odpovědi se zamysli nad tím, jak postavu co nejlépe nasměrovat k další části plánu hry. Neboj se improvizovat, pokud hráč udělá něco nečekaného, ale vždy se snaž držet plánu hry a přitom udržet hru zábavnou a napínavou. Také se neboj postavu nechat zemřít, pokud udělá něco hloupého nebo nevyjde něco riskantního, případně pokud hráč vystupuje z role postavy.`

export const storytellerConfig = {
  model: 'gemini-2.5-flash',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 200 },
    systemInstruction: storytellerInstructions,
    generationConfig: { responseMimeType: 'text/html' }
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
