<script>
  import { once } from 'svelte/legacy'
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { showSuccess } from '@lib/toasts'
  import { isFilledArray } from '@lib/utils'
  import { getPortraitUrl } from '@lib/database-browser'
  import { illustrationStyles } from '@lib/solo/solo'
  import { supabase, handleError } from '@lib/database-browser'
  import Loading from '@components/common/Loading.svelte'

  let { concept = $bindable(), user } = $props()

  let openGames = $state([])
  let creatingGame = $state(false)
  let retryingGeneration = $state(false)
  let selectedName = $state(isFilledArray(concept.protagonist_names) ? concept.protagonist_names[0] : '')

  onMount(async () => {
    // Start SSE generation if concept needs generating
    if (concept.generating.length > 0) {
      startGeneration()
    } else {
      // Load open games for this concept
      const { data, error } = await supabase.from('solo_games').select().match({ concept_id: concept.id, player: user.id }).order('created_at', { ascending: false })
      if (error) { handleError(error) }
      if (data) { openGames = data }
    }
  })

  async function startGeneration () {
    try {
      const body = {
        id: concept.id,
        author: user.id,
        name: concept.name,
        world: concept.prompt_world,
        plan: concept.prompt_plan,
        protagonist: concept.prompt_protagonist,
        locations: concept.prompt_locations,
        factions: concept.prompt_factions,
        characters: concept.prompt_characters,
        promptHeaderImage: concept.prompt_header_image,
        promptStorytellerImage: concept.prompt_storyteller_image,
        tags: concept.tags,
        generating: concept.generating
      }

      const response = await fetch('/api/solo/generateConcept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Generation request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = JSON.parse(line.substring(5).trim())
            handleSSEEvent(data)
          }
        }
      }
    } catch (error) {
      console.error('SSE Generation failed:', error)
      handleError(error)
    }
  }

  function handleSSEEvent (data) {
    if (data.step && data.generating) {
      // Update the generating array based on server response
      concept.generating = data.generating
      concept = { ...concept } // Trigger reactivity
    }

    if (data.status === 'Generation completed') {
      // Generation is complete, reload the page to show final result
      window.location.reload()
    }

    if (data.message && data.message.includes('Error')) {
      // Handle error
      concept.generation_error = data.message
      concept.generating = []
      concept = { ...concept } // Trigger reactivity
    }
  }

  function getTagNames (tags) {
    return tags.map(tag => { return gameTags.find(t => t.value === tag).label }).join(', ')
  }

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  async function startGame () {
    creatingGame = true
    try {
      const response = await fetch(`/api/solo/createGame?conceptId=${concept.id}&characterName=${encodeURIComponent(selectedName)}`, { method: 'GET' })
      const data = await response.json()
      if (!response.ok || data.error) { throw new Error(data.error.message) }
      if (data.success) {
        showSuccess('Hra byla úspěšně vytvořena')
        window.location.href = `/solo/game/${data.gameId}`
      }
    } catch (error) {
      handleError(error)
    } finally {
      creatingGame = false
    }
  }

  async function retryGeneration () {
    retryingGeneration = true
    try {
      // Reset the generating array in the database
      const { error: resetError } = await supabase.from('solo_concepts').update({
        generating: ['annotation', 'generated_world', 'generated_factions', 'generated_locations', 'generated_characters', 'generated_protagonist', 'generated_header_image', 'generated_storyteller_image', 'generated_plan', 'protagonist_names', 'inventory', 'abilities', 'header_image', 'storyteller_image'],
        generation_error: ''
      }).eq('id', concept.id)

      if (resetError) { throw new Error(resetError.message) }

      // Update local state
      concept.generating = ['annotation', 'generated_world', 'generated_factions', 'generated_locations', 'generated_characters', 'generated_protagonist', 'generated_header_image', 'generated_storyteller_image', 'generated_plan', 'protagonist_names', 'inventory', 'abilities', 'header_image', 'storyteller_image']
      concept.generation_error = ''
      concept = { ...concept } // Trigger reactivity

      // Start SSE generation
      startGeneration()

      showSuccess('Generování bylo znovu spuštěno')
    } catch (error) {
      handleError(error)
    } finally {
      retryingGeneration = false
    }
  }
</script>

{#if concept.generating.length > 0 || concept.generation_error}
  <h1>{concept.name}</h1>
  <div class='generating row'>
    {#if !concept.generation_error}
      <video src='/video/working.mp4' class='generating' autoplay loop muted playsinline alt='Generuji koncept'></video>
    {/if}
    <div class='info'>
      <h2>Prosím o strpení, připravuji<br>detaily konceptu...</h2>
      <ul>
        <li><span class='material'>{concept.generating.includes('generated_world') ? 'hourglass_top' : 'check'}</span><span class='wide'>Svět</span></li>
        <li><span class='material'>{concept.generating.includes('generated_factions') ? 'hourglass_top' : 'check'}</span><span class='wide'>Frakce</span></li>
        <li><span class='material'>{concept.generating.includes('generated_locations') ? 'hourglass_top' : 'check'}</span><span class='wide'>Místa</span></li>
        <li><span class='material'>{concept.generating.includes('generated_characters') ? 'hourglass_top' : 'check'}</span><span class='wide'>Postavy</span></li>
        <li><span class='material'>{concept.generating.includes('generated_protagonist') ? 'hourglass_top' : 'check'}</span><span class='wide'>Protagonista</span></li>
        <li><span class='material'>{concept.generating.includes('annotation') ? 'hourglass_top' : 'check'}</span><span class='wide'>Anotace</span></li>
        <li><span class='material'>{concept.generating.includes('generated_header_image') ? 'hourglass_top' : 'check'}</span><span class='wide'>Popis obrázku hlavičky</span></li>
        <li><span class='material'>{concept.generating.includes('generated_storyteller_image') ? 'hourglass_top' : 'check'}</span><span class='wide'>Popis obrázku vypravěče</span></li>
        <li><span class='material'>{concept.generating.includes('header_image') ? 'hourglass_top' : 'check'}</span><span class='wide'>Obrázek hlavičky</span></li>
        <li><span class='material'>{concept.generating.includes('storyteller_image') ? 'hourglass_top' : 'check'}</span><span class='wide'>Obrázek vypravěče</span></li>
        <li><span class='material'>{concept.generating.includes('protagonist_names') ? 'hourglass_top' : 'check'}</span><span class='wide'>Jména pro postavu</span></li>
        <li><span class='material'>{concept.generating.includes('inventory') ? 'hourglass_top' : 'check'}</span><span class='wide'>Inventář</span></li>
        <li><span class='material'>{concept.generating.includes('abilities') ? 'hourglass_top' : 'check'}</span><span class='wide'>Schopnosti</span></li>
        <li><span class='material'>{concept.generating.includes('generated_plan') ? 'hourglass_top' : 'check'}</span><span class='wide'>Příběh</span></li>
      </ul>
    </div>
  </div>
  {#if concept.generation_error}
    <h2>Při generování došlo k chybě</h2>
    <div class='error'>
      <p>{concept.generation_error}</p>
      <div class='retry'>
        {#if retryingGeneration}
          <Loading />
        {:else}
          <button onclick={retryGeneration}>Zkusit znovu</button>
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <div class='headline'>
    <h1>{concept.name}</h1>
    <div class='buttons'>
      {#if user.id === concept.author.id}
        <button onclick={showSettings} class='material settings square' title='Nastavení konceptu' use:tooltip>settings</button>
      {/if}
    </div>
  </div>
  <div class='content'>
    <div class='intro'>
      <p class='perex'>{@html concept.annotation || '<i>Žádný popis</i>'}</p>
      <details>
        <summary>Svět</summary>
        <div class='inner'>
          <p>{@html concept.generated_world}</p>
        </div>
      </details>
      <details>
        <summary>Postava</summary>
        <div class='inner'>
          <p>{@html concept.generated_protagonist}</p>
          <div class='character-lists'>
            <div>
              <h3>Inventář</h3>
              <ul class='inventory grid'>
                {#each concept.inventory as item, i (i)}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
            <div>
              <h3>Schopnosti</h3>
              <ul class='abilities grid'>
                {#each concept.abilities as abil, i (i)}
                  <li>{abil}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      </details>
      {#if openGames.length > 0}
        <div class='games'>
          <h2>Tvoje rozehrané hry</h2>
          <ul class='games'>
            {#each openGames as game (game.id)}
              <li><a href={`/solo/game/${game.id}`}>{game.name}</a></li>
            {/each}
          </ul>
        </div>
      {/if}
      <h2>Nová hra</h2>
      <div class='names'>
        <h3>Jméno postavy</h3>
        <div class='grid'>
          {#each concept.protagonist_names as name (name)}
            <label title='Jméno protagonisty'>
              <input type='radio' name='protagonist_name' value={name} bind:group={selectedName} />
              <span>{name}</span>
            </label>
          {/each}
        </div>
      </div>
      <div class='create'>
        {#if creatingGame}
          <Loading />
        {:else}
          <button onclick={once(startGame)} class='large'>Začít novou hru</button>
        {/if}
      </div>
    </div>
    <aside>
      <ul>
        <li>
          <span class='label'>Autor:</span>
          <a href='./user?id={concept.author.id}' class='user author' title='autor'>
            {#if concept.author.portrait}<img src={getPortraitUrl(concept.author.id, concept.author.portrait)} class='icon' alt={concept.author.name} />{/if}
            {concept.author.name}
          </a>
        </li>
        <li><span class='label'>Vytvořeno:</span> {new Date(concept.created_at).toLocaleDateString('cs-CZ')}</li>
        <li><span class='label'>Počet her:</span> {concept.game_count}</li>
        <li><span class='label'>Tagy:</span> {getTagNames(concept.tags)}</li>
        <li><span class='label'>Styl:</span> {illustrationStyles.find(style => style.value === concept.illustration_style)?.label}</li>
      </ul>
    </aside>
  </div>
{/if}

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    gap: 10px;
  }
    h1 {
      flex: 1;
      margin: 0px;
    }
    .headline button {
      flex-shrink: 0;
    }
  .content {
    display: flex;
    flex-direction: row;
    gap: 40px;
  }
    .generating ul, aside ul {
      list-style: none;
      padding: 0px;
    }
      .generating li, aside li {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    /* generating */
    .row {
      display: flex;
      justify-content: center;
      gap: 60px;
    }
    .generating {
      text-align: center;
      align-items: center;
      margin-top: 20px;
    }
      .generating video {
        width: 320px;
        height: 320px;
        display: block;
        margin: 0 auto;
        border-radius: 20px;
      }
      .generating li .material {
        display: inline-block;
        width: 30px;
      }
    .info {
      flex: 1;
      text-align: left;
    }
    /* promo */
    p {
      line-height: 1.5;
    }
    aside {
      min-width: 250px;
    }
      aside li {
        height: 30px;
        margin-bottom: 10px;
      }
        aside li .label {
          color: var(--dim);
          min-width: 90px;
        }
      .author {
        display: flex;
        align-items: center;
        gap: 10px;
      }
        .icon {
          display: block;
          width: 40px;
          height: 40px;
          object-fit: cover;
          object-position: center 20%;
          border-radius: 100%;
          background-color: var(--background);
        }
    .create {
      margin-top: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    details {
      background: var(--block);
      border-radius: 10px;
      margin-top: 10px;
      box-shadow: var(--shadow);
    }
      summary {
        cursor: pointer;
        font-weight: bold;
        padding: 15px;
      }
      .inner {
        padding: 15px;
        padding-top: 0px;
      }
    .names {
      padding: 20px;
      background: var(--block);
      border-radius: 10px;
      margin-top: 10px;
    }
      .names h3 {
        margin-top: 0px;
      }
      .names label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
      }
      .names input {
        width: 20px;
        height: 20px;
      }
      .names .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
    .games ul {
      list-style: none;
      padding: 0px;
      margin-top: 10px;
    }
      .games li a {
        display: block;
        width: 100%;
        background: var(--block);
        border-radius: 10px;
        margin-top: 10px;
        box-shadow: var(--shadow);
        padding: 15px;
      }
    .character-lists {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .inventory li, .abilities li {
      margin-bottom: 10px;
    }

  @media (max-width: 500px) {
    .headline {
      margin-top: 20px;
    }
    .buttons {
      display: flex;
      flex: 0.1;
      gap: 5px;
    }
      .buttons button {
        width: 35px;
        height: 35px;
        font-size: 20px;
        padding: 0px;
      }
    .content {
      flex-direction: column;
    }
    aside {
      margin-top: 20px;
      padding: 10px;
    }
  }
</style>
