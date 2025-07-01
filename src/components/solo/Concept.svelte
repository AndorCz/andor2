<script>
  import { once } from 'svelte/legacy'
  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { showSuccess } from '@lib/toasts'
  import { isFilledArray } from '@lib/utils'
  import { getPortraitUrl } from '@lib/database-browser'
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import Loading from '@components/common/Loading.svelte'

  let { concept = $bindable(), user } = $props()

  let checkLoop = null
  let openGames = $state([])
  let creatingGame = $state(false)
  let selectedName = $state(isFilledArray(concept.protagonist_names) ? concept.protagonist_names[0] : '')

  onMount(async () => {
    // Call generation API and periodically check if the concept is done generating
    if (concept.generating.length > 0) {
      checkLoop = setInterval(async () => { // check status every 5 seconds
        console.log('checking concept generation status...')
        const { data, error } = await supabase.from('solo_concepts').select('*, author: profiles(id, name, portrait)').eq('id', concept.id).single()
        if (error) { handleError(error) }
        if (data) { concept = data }
        if (data && data.generating.length === 0) {
          selectedName = isFilledArray(data.protagonist_names) ? data.protagonist_names[0] : ''
          clearInterval(checkLoop)
          checkLoop = null
          window.location.reload()
        }
      }, 5000)
    } else {
      // Load open games for this concept
      const { data, error } = await supabase.from('solo_games').select().match({ concept_id: concept.id, player: user.id }).order('created_at', { ascending: false })
      if (error) { handleError(error) }
      if (data) { openGames = data }
    }
  })

  onDestroy(() => { if (checkLoop) { clearInterval(checkLoop) } })

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
      if (!response.ok || data.error) { throw new Error(data.error) }
      if (data.success) {
        showSuccess('Hra byla úspěšně vytvořena')
        window.location.href = `/solo/game/${data.gameId}`
      }
    } catch (error) {
      handleError(error.message)
    } finally {
      creatingGame = false
    }
  }
</script>

{#if concept.generating.length > 0}
  <h1>{concept.name}</h1>
  <div class='generating row'>
    <video src='/video/working.mp4' class='generating' autoplay loop muted playsinline alt='Generuji koncept'></video>
    <div class='info'>
      <h2>Prosím o strpení,<br>připravuji detaily konceptu...</h2>
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
        <li><span class='material'>{concept.generating.includes('generated_plan') ? 'hourglass_top' : 'check'}</span><span class='wide'>Příběh</span></li>
      </ul>
    </div>
  </div>
{:else}
  <div class='headline'>
    <h1>{concept.name}</h1>
    {#if user.id === concept.author.id}
      <button onclick={showSettings} class='material settings square' title='Nastavení konceptu' use:tooltip>settings</button>
    {/if}
  </div>
  <div class='panel row'>
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
      margin: 0;
    }
    .headline button {
      flex-shrink: 0;
    }
  ul {
    list-style: none;
    padding: 0px;
  }
    li {
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
      li .label {
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
  .games h2 {
    margin-bottom: 0px;
  }
  .games ul {
    margin-top: 10px;
  }
    .games li a {
      display: block;
      width: 100%;
      background: var(--block);
      border-radius: 10px;
      margin-top: 10px;
      box-shadow: var(--shadow);
      padding: 10px;
    }
</style>
