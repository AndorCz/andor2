export const storytellerConfig = {
  model: 'gemini-2.5-flash',
  config: {
    safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }],
    thinkingConfig: { thinkingBudget: 200 },
    systemInstruction: 'Jsi vypravěč (storyteller nebo game-master) online TTRPG hry, pro jednoho hráče, v češtině. Výstup piš vždy v HTML, ale používej jen základní styly textu jako tučný text pro přímou řeč. Žádné nadpisy, ikony, seznamy apod. Herní příspěvky by měli mít formu kvalitní beletrie.'
  }
}
