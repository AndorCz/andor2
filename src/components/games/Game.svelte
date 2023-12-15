<script>
  import { clone } from '@lib/utils'
  import { gameStore } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess, showError } from '@lib/toasts'
  import EditableLong from '@components/misc/EditableLong.svelte'
  import Character from '@components/games/Character.svelte'
  import Discussion from '@components/Discussion.svelte'
  
  export let user
  export let data = {}

  let store = gameStore(data.id, 'info') // save last used to localstorage
  let isOwner = data.profiles.id === user.id
  let generatingStory = false

  const characters = { playing: [], waiting: [], open: [] }
  data.characters.forEach((char) => {
    if (char.open) { // open
      characters.open.push(char)
    } else if (char.profiles) {
      if (char.accepted) { // playing
        if (isOwner || isMine(character)) {
          characters.playing.push(char)
        } else if (!character.hidden) {
          characters.playing.push(char)
        }
      } else { // waiting
        characters.waiting.push(char)
      }
    }
  })

  if (!isOwner && $store.activeTab === 'chars') { $store.activeTab = 'info' } // if you get logged out

  async function updateGame () {
    const clean = clone(data)
    delete clean.id
    delete clean.profiles
    delete clean.characters
    const { error } = await supabase.from('games').update(clean).eq('id', data.id)
    if (error) { handleError(error) }
    else { showSuccess('Uloženo') }
  }

  async function generateStory () {
    generatingStory = true
    data.secrets = 'načítám...'
    const res = await fetch('/api/game/generateStory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: data.id, intro: data.intro, owner: data.profiles.id, system: data.system })
    })
    res.json().then((res) => {
      if (res.error) { showError(res.error) }
      else {
        showSuccess('Vygenerováno')
        generatingStory = false
        data.secrets = res.story
      }
    })
  }
</script>

<h1>{data.name}</h1>

<nav class='tabs secondary'>
  <button on:click={() => { $store.activeTab = 'info' }} class={$store.activeTab === 'info' ? 'active' : ''}>Info</button>
  <button on:click={() => { $store.activeTab = 'chat' }} class={$store.activeTab === 'chat' ? 'active' : ''}>Chat</button>
  <button on:click={() => { $store.activeTab = 'game' }} class={$store.activeTab === 'game' ? 'active' : ''}>Hra</button>
  {#if isOwner}<!-- only for the owner, for now -->
    <button on:click={() => { $store.activeTab = 'chars' }} class={$store.activeTab === 'chars' ? 'active' : ''}>Postavy</button>
  {/if}
</nav>

<div class='content'>
  {#if $store.activeTab === 'info'}

    <h2>Úvod</h2>
    <EditableLong bind:value={data.intro} onSave={updateGame} canEdit={isOwner} />
    <h2>Pro hráče</h2>
    <EditableLong bind:value={data.info} onSave={updateGame} canEdit={isOwner} />
    {#if isOwner}
      <h2>Podklady vypravěče <span>(hráčům skryté)</span></h2>
      <EditableLong bind:value={data.secrets} onSave={updateGame} canEdit={isOwner} loading={generatingStory} />
      <br>
      <button on:click={generateStory} disabled={generatingStory}>Vygenerovat podklady AI</button>
      <span class='warning'>Upozornění: Tato akce potrvá cca 5 minut a přepíše obsah tohoto pole.</span>
    {/if}
    <br><br><br><br>
    Správce hry: {data.profiles.name}

  {:else if $store.activeTab === 'chat'}

    <h2>Veřejná diskuze</h2>
    <Discussion />

  {:else if $store.activeTab === 'game'}

    <h2>Herní příspěvky</h2>

  {:else if $store.activeTab === 'chars'}

    <h2>Ve hře</h2>
    <ul class='characters'>
      {#each characters.playing as character}
        <Character {character} {isOwner} {user} />
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <h2>Hlásí se</h2>
    <ul class='characters'>
      {#each characters.waiting as character}
        <Character {character} {isOwner} {user} />
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <h2>Volné</h2>
    <ul class='characters'>
      {#each characters.open as character}
        <Character {character} {isOwner} {user} />
      {:else}
        <li>Žádné postavy</li>
      {/each}
    </ul>
    <br>
    <center>
      <a href='./character-form' class='button'>Vytvořit novou postavu</a>
    </center>

  {/if}
</div>

<style>
  .content {
    padding: 40px;
  }
  .characters {
    padding: 0px;
  }
    .characters li {
      margin-left: 40px;
    }
  h2 {
    margin-top: 50px;
  }
    h2 span {
      font-size: 14pt;
      font-style: italic;
      opacity: 0.5;
    }
  .warning {
    margin-left: 20px;
  }
</style>