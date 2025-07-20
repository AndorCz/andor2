<script>
  import Select from 'svelte-select'
  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { onDestroy } from 'svelte'
  import { showSuccess } from '@lib/toasts'
  import { clone, getStamp } from '@lib/utils'
  import EditableLong from '@components/common/EditableLong.svelte'
  import ButtonLoading from '@components/common/ButtonLoading.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'

  let { concept, user } = $props()

  let checkLoop
  let tab = $state('prompts')
  let headlineEl = $state()
  let selectedTags = $derived.by(() => {
    return concept.tags?.map(tag => {
      const found = gameTags.find(t => t.value === tag)
      return found ? { value: found.value, label: found.label } : { value: tag, label: tag }
    }) || []
  })
  const savingValues = $state({})
  const originalValues = $state(clone(concept))
  const tagItems = [...gameTags]

  const illustrationStyles = [
    { value: 'rpg', label: 'RPG kniha' },
    { value: 'anime', label: 'Anime' },
    { value: 'realistic', label: 'Realistický' }
  ]

  async function onSave (field, generated = false) {
    const value = concept[field]
    try {
      savingValues[field] = true
      const { error } = await supabase.from('solo_concepts').update({ [field]: value }).eq('id', concept.id)
      if (error) { throw error }
      // Call generation API if needed
      if (generated) {
        concept.generating.push(field) // Mark UI as generating
        const response = await fetch('/api/solo/generateField', { method: 'POST', body: JSON.stringify({ conceptId: concept.id, field, value }), headers: { 'Content-Type': 'application/json' } })
        if (!response.ok) { throw new Error(`API error: ${(await response.json()).error.message || 'Chyba generování pole'}`) }
        checkLoop = setInterval(async () => {
          const { data, error } = await supabase.from('solo_concepts').select().eq('id', concept.id).single()
          if (error) { throw error }
          if (data && !data.generating.includes(field)) {
            concept = data // Update the full concept with server data
            if (field === 'prompt_header_image' || field === 'prompt_storyteller_image') { window.location.reload() } // Reload to show new image
            showSuccess('Pole bylo úspěšně aktualizováno a podklady přegenerovány')
            clearInterval(checkLoop)
          }
        }, 5000)
      } else {
        showSuccess('Pole bylo úspěšně aktualizováno')
      }
    } catch (error) {
      if (checkLoop) { clearInterval(checkLoop) }
      handleError(error)
    } finally {
      concept[field] = value
      savingValues[field] = false
      originalValues[field] = value
    }
  }

  async function regenerateNames () {
    savingValues.protagonist_names = true
    const response = await fetch('/api/solo/generateField', { method: 'POST', body: JSON.stringify({ conceptId: concept.id, field: 'protagonist_names' }), headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) {
      const { error } = await response.json()
      savingValues.protagonist_names = false
      return handleError(new Error(`API error: ${error.message || 'Chyba generování jmen protagonisty'}`))
    }
    const { data, error } = await supabase.from('solo_concepts').select().eq('id', concept.id).single()
    if (error) {
      savingValues.protagonist_names = false
      return handleError(error)
    }
    concept.protagonist_names = data.protagonist_names
    savingValues.protagonist_names = false
  }

  async function regenerateItems () {
    savingValues.inventory = true
    const response = await fetch('/api/solo/generateField', { method: 'POST', body: JSON.stringify({ conceptId: concept.id, field: 'inventory' }), headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) {
      const { error } = await response.json()
      savingValues.inventory = false
      return handleError(new Error(`API error: ${error.message || 'Chyba generování vybavení'}`))
    }
    const { data, error } = await supabase.from('solo_concepts').select().eq('id', concept.id).single()
    if (error) {
      savingValues.inventory = false
      return handleError(error)
    }
    concept.inventory = data.inventory
    savingValues.inventory = false
  }

  async function saveTags () {
    savingValues.tags = true
    const { error } = await supabase.from('solo_concepts').update({ tags }).eq('id', concept.id)
    if (error) { return handleError(error) }
    originalValues.tags = tags
    concept.tags = tags
    savingValues.tags = false
    showSuccess('Tagy byly úspěšně uloženy')
  }

  function showConcept () {
    window.location.href = `/solo/concept/${concept.id}`
  }

  onDestroy(() => {
    if (checkLoop) { clearInterval(checkLoop) }
  })

  async function deleteConcept () {
    const { error } = await supabase.from('solo_concepts').delete().eq('id', concept.id)
    if (error) { return handleError(error) }

    // Delete header image
    const { error: removeError } = await supabase.storage.from('headers').remove(`solo-${concept.id}.jpg`)
    if (removeError) { return handleError(removeError) }

    // Delete storyteller image
    const { error: storytellerError } = await supabase.storage.from('avatars').remove(`${concept.storyteller}.jpg`)
    if (storytellerError) { return handleError(storytellerError) }

    window.location.href = '/solo?toastType=success&toastText=' + encodeURIComponent('Koncept byl smazán')
  }

  const maxTags = $derived(selectedTags?.length === 3)
  const tags = $derived(selectedTags?.map(tag => tag.value) || [])
</script>

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/solo/concept/{concept.id}' class='backlink'>{concept.name}</a>
    <h1>Nastavení</h1>
    <button onclick={showConcept} class='material square back' title='Zpět na koncept' use:tooltip>arrow_back</button>
  </div>
</div>

<nav class='tabs secondary'>
  <button onclick={() => { tab = 'prompts' }} class={tab === 'prompts' ? 'active' : ''}>Uživatelské vstupy</button>
  <button onclick={() => { tab = 'generated' }} class={tab === 'generated' ? 'active' : ''}>Generované podklady (spoiler)</button>
</nav>

<main>
  {#if tab === 'prompts'}
    <h2>Název</h2>
    <div class='row'>
      <input type='text' bind:value={concept.name} maxlength='80' />
      <button onclick={() => onSave('name')} disabled={savingValues.name || (originalValues.name === concept.name)} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Anotace</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.annotation} loading={concept.generating.includes('annotation')} maxlength={700} />
      <button onclick={() => onSave('annotation')} disabled={concept.generating.includes('annotation') || savingValues.annotation || originalValues.annotation === concept.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Svět</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_world} loading={concept.generating.includes('prompt_world')} placeholder='V jakém světě a časovém období se hra odehrává?' maxlength={1000} />
      <button onclick={() => onSave('prompt_world', true)} disabled={concept.generating.includes('prompt_world') || savingValues.prompt_world || originalValues.prompt_world === concept.prompt_world} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Hráčská postava</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_protagonist} loading={concept.generating.includes('prompt_protagonist')} placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' maxlength={1000} />
      <button onclick={() => onSave('prompt_protagonist', true)} disabled={concept.generating.includes('prompt_protagonist') || savingValues.prompt_protagonist || originalValues.prompt_protagonist === concept.prompt_protagonist} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Příběh</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_plan} loading={concept.generating.includes('prompt_plan')} placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' maxlength={1000} />
      <button onclick={() => onSave('prompt_plan', true)} disabled={concept.generating.includes('prompt_plan') || savingValues.prompt_plan || originalValues.prompt_plan === concept.prompt_plan} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Inventář</h2>
    <div>
      <div class='columns'>
        {#if Array.isArray(concept.inventory)}
          {#each concept.inventory as item, index (index)}
            <div class='name row'>
              <input type='text' bind:value={concept.inventory[index]} placeholder='Předmět' />
              {#if concept.inventory.length > 1}<button onclick={() => { concept.inventory.splice(index, 1) }} class='material delete square' title='Smazat předmět' use:tooltip>delete</button>{/if}
            </div>
          {/each}
        {:else}
          <center class='info'>Předměty se právě generují...</center>
        {/if}
      </div>
      <center>
        <button onclick={() => { concept.inventory.push('') }} class='add'>Přidat předmět</button>
        <ButtonLoading label='Přegenerovat' handleClick={regenerateItems} loading={savingValues.inventory} class='add' />
        <button onclick={() => onSave('inventory')} disabled={savingValues.inventory || JSON.stringify(originalValues.inventory) === JSON.stringify(concept.inventory)} class='save'>Uložit předměty</button>
      </center>
    </div>

    <h2>Nabídka jmen pro hlavní postavu</h2>
    <div>
      <div class='columns'>
        {#if Array.isArray(concept.protagonist_names)}
          {#each concept.protagonist_names as name, index (index)}
            <div class='name row'>
              <input type='text' bind:value={concept.protagonist_names[index]} placeholder='Jméno' />
              {#if concept.protagonist_names.length > 1}<button onclick={() => { concept.protagonist_names.splice(index, 1) }} class='material delete square' title='Smazat jméno' use:tooltip>delete</button>{/if}
            </div>
          {/each}
        {:else}
          <center class='info'>Jména se právě generují...</center>
        {/if}
      </div>
      <center>
        <button onclick={() => { concept.protagonist_names.push('') }} class='add'>Přidat jméno</button>
        <ButtonLoading label='Přegenerovat' handleClick={regenerateNames} loading={savingValues.protagonist_names} class='add' />
        <button onclick={() => onSave('protagonist_names')} disabled={savingValues.protagonist_names || JSON.stringify(originalValues.protagonist_names) === JSON.stringify(concept.protagonist_names)} class='save'>Uložit jména</button>
      </center>
    </div>

    <h2>Místa</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_locations} loading={concept.generating.includes('prompt_locations')} placeholder='Jaká místa jsou pro hru důležitá? (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_locations', true)} disabled={concept.generating.includes('prompt_locations') || savingValues.prompt_locations || originalValues.prompt_locations === concept.prompt_locations} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Frakce</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_factions} loading={concept.generating.includes('prompt_factions')} placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité? (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_factions', true)} disabled={concept.generating.includes('prompt_factions') || savingValues.prompt_factions || originalValues.prompt_factions === concept.prompt_factions} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Postavy</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_characters} loading={concept.generating.includes('prompt_characters')} placeholder='Jaké postavy jsou pro hru důležité? (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_characters', true)} disabled={concept.generating.includes('prompt_characters') || savingValues.prompt_characters || originalValues.prompt_characters === concept.prompt_characters} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Styl ilustrace</h2>
    <div class='row'>
      <select bind:value={concept.illustration_style} onchange={() => onSave('illustration_style')} class='styleSelect'>
        {#each illustrationStyles as style (style.value)}
          <option value={style.value}>{style.label}</option>
        {/each}
      </select>
    </div>

    <h2>Obrázek do hlavičky</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_header_image} loading={concept.generating.includes('prompt_header_image')} placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_header_image', true)} disabled={concept.generating.includes('prompt_header_image') || savingValues.prompt_header_image || originalValues.prompt_header_image === concept.prompt_header_image} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Ikonka vypravěče</h2>
    <div class='row'>
      <div class='avatar'>
        <img src={getPortraitUrl(concept.storyteller, getStamp())} class='portrait' alt='avatar vypravěče' />
        <TextareaExpandable {user} bind:value={concept.prompt_storyteller_image} loading={concept.generating.includes('prompt_storyteller_image')} placeholder='Popiš vizuálně avatar vypravěče (nepovinné)' maxlength={1000} minHeight={180} />
      </div>
      <button onclick={() => onSave('prompt_storyteller_image', true)} disabled={concept.generating.includes('prompt_storyteller_image') || savingValues.prompt_storyteller_image || originalValues.prompt_storyteller_image === concept.prompt_storyteller_image} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Tagy</h2>
    <div class='row'>
      <Select items={maxTags ? [] : tagItems} bind:value={selectedTags} multiple placeholder=''>
        {#snippet empty()}<div>Více tagů nelze přidat</div>{/snippet}
      </Select>
      <button onclick={saveTags} disabled={ savingValues.tags || originalValues.tags.join(',') === tags.join(',')} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Smazání konceptu</h2>
    <p>Pozor, toto je nevratná akce</p>
    <button class='delete' onclick={() => { if (confirm('Opravdu chcete smazat tento koncept?')) { deleteConcept() } }}>
      <span class='material'>warning</span><span>Smazat koncept hry</span>
    </button>
  {/if}
  {#if tab === 'generated'}
    <p class='info'>Pole na této stránce jsou automaticky generovaná. Můžeš je upravit ručně, ale mohou být přegenerovaná úpravou vstupů na předchozí záložce.</p>
    <h2>Svět</h2>
    <EditableLong {user} value={concept.generated_world} onSave={(value) => onSave('generated_world', value)} canEdit allowHtml />
    <h2>Frakce</h2>
    <EditableLong {user} value={concept.generated_factions} onSave={(value) => onSave('generated_factions', value)} canEdit allowHtml />
    <h2>Místa</h2>
    <EditableLong {user} value={concept.generated_locations} onSave={(value) => onSave('generated_locations', value)} canEdit allowHtml />
    <h2>Postavy</h2>
    <EditableLong {user} value={concept.generated_characters} onSave={(value) => onSave('generated_characters', value)} canEdit allowHtml />
    <h2>Protagonista</h2>
    <EditableLong {user} value={concept.generated_protagonist} onSave={(value) => onSave('generated_protagonist', value)} canEdit allowHtml />
    <h2>Plán hry</h2>
    <EditableLong {user} value={concept.generated_plan} onSave={(value) => onSave('generated_plan', value)} canEdit allowHtml />
    <h2>Obrázek hlavičky</h2>
    <EditableLong {user} value={concept.generated_header_image} onSave={(value) => onSave('generated_header_image', value)} canEdit allowHtml />
    <h2>Ikonka vypravěče</h2>
    <EditableLong {user} value={concept.generated_storyteller_image} onSave={(value) => onSave('generated_storyteller_image', value)} canEdit allowHtml />
  {/if}
</main>

<style>
  .headline {
    position: sticky;
    top: -1px; /* needed for observer */
    background-color: var(--panel);
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0px -30px;
    z-index: 10;
  }
    .wrapper {
      padding: 0px 30px;
    }
      .headline .backlink {
        font-family: var(--headlineFont);
        display: inline-block;
        font-size: inherit;
      }
      .headline h1 {
        margin: 0px;
        margin-top: -5px;
        padding: 0px;
      }
      .back {
        position: absolute;
        top: 8px;
        right: 20px;
      }

  main {
    max-width: 800px;
    margin: auto;
  }

  h2 {
    margin-top: 50px;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
    input[type=text] {
      width: 100%;
    }

  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
  }
  center {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  .delete {
    display: flex;
    gap: 10px;
  }
  .avatar {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
    .portrait {
      display: block;
      width: 70px;
      height: fit-content;
    }
  .styleSelect {
    min-width: 200px;
  }

  p.info {
    padding-top: 40px;
  }

  @media (max-width: 1200px) {
    .headline {
      margin: 0px -30px;
    }
  }

  @media (max-width: 860px) {
    main {
      padding: 10px;
    }
    .headline {
      margin: 0px -15px;
    }
  }
</style>
