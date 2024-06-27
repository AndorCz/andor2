<script>
  import { supabase, handleError } from '@lib/database-browser'
  import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
  import { showSuccess } from '@lib/toasts'
  import { gatherCodex } from '@lib/ai'
  import EditableLong from '@components/common/EditableLong.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user
  export let game
  export let isStoryteller

  let generating = false
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
  ]
  const gemini = new GoogleGenerativeAI(import.meta.env.PUBLIC_GEMINI)
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings })

  async function generate () {
    const codex = await gatherCodex(game.id)
    // console.log(codex)

    game.story = ''
    generating = true

    const basePrompt = `Jsi pomocník vypravěče pro TTRPG (tabletop role-playing) hru hranou online přes textové příspěvky, v českém jazyce.
      Tvá úloha je pro vypravěče napsat podklady pro hru, formátované pomocí HTML 5 značek (důležité!). Ne markdown.
      Hra kterou připravujeme se jmenuje "${decodeURIComponent(game.name)}"
      Základní popis hry zní: "${decodeURIComponent(game.annotation)}"
      ${codex}
      ---
    `

    let finalPrompt
    if (game.prompt) {
      finalPrompt = basePrompt + `Toto je zadání od vypravěče, pro přípravu podkladů:
        ${decodeURIComponent(game.prompt)}`
    } else {
      finalPrompt = basePrompt + `Sepiš strukturovaně pět kategorií podkladů:
        1. Místo: Kde se hra odehrává? Kdy? Vypiš na jeden řádek stručně tyto dvě faktické informace. Na další řádek přidej jednu větu kterou shrneš (či vymyslíš) aktuální setting a druhou větu o čem v kampani půjde.
        2. Frakce: Popiš jaké frakce operují v dané lokaci a jaký je mezi nimi vztah. Kdo kontroluje jaké území, jaké mají cíle, plány a problémy.
        3. Postavy: Popiš stručně 10 nejdůležitějších (nehráčských) postav příběhu. Začni nejvlivnějšími postavami a postupně pokračuj i na ty se kterými se hráči dostanou snáze do kontaktu. Na všech by měly být kladné i záporné vlastnosti. O každé postavě napiš stručně následující: Jak postava vypadá, jaké je národnosti, etnika, kultury, jak se odívá. K jaké frakci náleží, jaký má charakter, společenskou úlohu, stáří, vliv. Jak se jmenuje a kdo má pro ní případně jaké přezdívky. Zvol zajímavé (ale uvěřitelné) jméno, dobře zapamatovatelná, dobře sedící k charakteru a kultuře postavy. Její stručnou historii. Jaké má cíle a problémy. Jaké jsou její nejdůležitější vztahy.
        4. Lokace: Popiš stručně 10 nejdůležitějších lokací příběhu. Základny frakcí, důležitá veřejná místa, útočiště, domovy, podniky, shromaždiště, apod. O každé lokaci napiš stručně následující: Oficiální název a případné alternativní názvy. Jak lokace vypadá, v jakém je stavu a kdo v ní bývá k nalezení (běžní občané, postavy, zvířata etc.). Kdo má případně lokaci pod kontrolou - frakce, postava.
        5. Příběh: Navrhni tři body příběhu kterých se může vypravěč chytit. Úvod: Kde příběh začne, co dostane hráčské postavy dohromady a donutí je spolupracovat. Nastol ústřední konflikt, úkol, záhadu - ideálně vše zmíněné. Střed: K čemu se musí hráči dopracovat? Jaké obtíže budou muset překonat? Jaké nové problémy se objeví? Jaké nové prostředky budou moci získat? Jak vede problém či záhada hlouběji než si dosud mysleli? Závěr: Jaké je rozuzlení záhady a uspokojivý cíl příběhu? K jakému bodu se musí ultimátně dostat pro zdárné zakončení kampaně? Buď konkrétní: Urči jaké postavy, předměty a lokace budou jakým způsobem důležité pro posun příběhu.
      `
    }

    const result = await model.generateContentStream(finalPrompt)

    for await (const chunk of result.stream) {
      if (!generating) { break }
      const chunkText = chunk.text()
      game.story += chunkText
    }
    if (generating) {
      showSuccess('Generování dokončeno')
      updateGameInfo()
    }
    generating = false
  }

  async function cancel () {
    generating = false
    showSuccess('Generování zrušeno')
  }

  async function updateGameInfo () {
    const newData = { notes: game.notes, prompt: game.prompt, story: game.story }
    const { error } = await supabase.from('games').update(newData).eq('id', game.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }
</script>

<main>
  <h2>Poznámky</h2>
  <EditableLong placeholder='Poznámky a zápisky ke hře, záznamy o hraní, plány apod.' {user} bind:value={game.notes} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} />

  <h2>AI generování podkladů</h2>
  <div class='generate'>
    <TextareaExpandable minHeight={50} placeholder='Zde popiš co chceš od AI napsat. Pokud pole nevyplníš, vygenerují se kompletní podklady dle naší šablony.' bind:value={game.prompt} {user} />
    {#if generating}
      <button on:click={cancel}>Zrušit</button>
    {:else}
      <button on:click={generate} loading={generating}>Generovat</button>
    {/if}
  </div>
  <EditableLong allowHtml placeholder='Výstup generovaných podkladů' {user} bind:value={game.story} onSave={() => updateGameInfo(false)} canEdit={isStoryteller} loading={generating} />
</main>

<style>
  h2 {
    margin-top: 50px;
  }
  .generate {
    position: relative;
    margin-bottom: 20px;
  }
    .generate button {
      position: absolute;
      bottom: 0px;
      right: 0px;
    }
</style>
