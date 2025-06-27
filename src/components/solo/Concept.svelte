<script>
  import { once } from 'svelte/legacy'

  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { getPortraitUrl } from '@lib/database-browser'
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'

  let { concept = $bindable(), user } = $props()

  let checkLoop = null
  let openGames = $state([])

  onMount(async () => {
    // Call generation API and periodically check if the concept is done generating
    if (concept.generating) {
      checkLoop = setInterval(async () => { // check status every 5 seconds
        console.log('checking concept generation status...')
        const { data, error } = await supabase.from('solo_concepts').select('*, author: profiles(id, name, portrait)').eq('id', concept.id).single()
        if (error) { handleError(error) }
        if (data) { concept = data }
        if (data && !data.generating) {
          clearInterval(checkLoop)
          checkLoop = null
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

  function startGame () {
    window.location.href = `/api/solo/createGame?conceptId=${concept.id}`
  }
</script>

{#if concept.generating}
  <h1>{concept.name}</h1>
  <div class='generating row'>
    <video src='/video/working.mp4' class='generating' autoplay loop muted playsinline alt='Generuji koncept'></video>
    <div class='info'>
      <h2>Prosím o strpení,<br>připravuji detaily konceptu...</h2>
      <ul>
        <li><span class='material'>{concept.generated_world && concept.generated_world !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Svět</span></li>
        <li><span class='material'>{concept.generated_factions && concept.generated_factions !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Frakce</span></li>
        <li><span class='material'>{concept.generated_locations && concept.generated_locations !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Místa</span></li>
        <li><span class='material'>{concept.generated_characters && concept.generated_characters !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Postavy</span></li>
        <li><span class='material'>{concept.generated_protagonist && concept.generated_protagonist !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Protagonista</span></li>
        <li><span class='material'>{concept.generated_plan && concept.generated_plan !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Příběh</span></li>
        <li><span class='material'>{concept.annotation && concept.annotation !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Anotace</span></li>
        <li><span class='material'>{concept.generated_image && concept.generated_image !== 'generating' ? 'check' : 'hourglass_top'}</span><span class='wide'>Obrázky</span></li>
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
        <summary>Tvoje postava</summary>
        <p>{@html concept.generated_protagonist}</p>
      </details>
      <details>
        <summary>Svět</summary>
        <p>{@html concept.generated_world}</p>
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
      <button onclick={once(startGame)} class='large'>Začít novou hru</button>
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
  button.large {
    display: block;
    margin: auto;
    margin-top: 20px;
  }
  details {
    background: var(--block);
    border-radius: 10px;
    margin-top: 10px;
    box-shadow: var(--shadow);
    padding: 10px;
  }
    summary {
      cursor: pointer;
      font-weight: bold;
    }
  .games h2 {
    margin-top: 40px;
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
