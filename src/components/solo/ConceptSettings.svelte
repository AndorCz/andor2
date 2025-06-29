<script>
  import { run } from 'svelte/legacy'
  import { clone } from '@lib/utils'
  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { showSuccess } from '@lib/toasts'
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError, deleteStorageFolder } from '@lib/database-browser'
  import Select from 'svelte-select'
  import EditableLong from '@components/common/EditableLong.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  let { concept = $bindable(), user } = $props()

  let checkLoop
  let tab = $state('prompts')
  let tags = $state()
  let headlineEl = $state()
  let selectedTags = $state()
  const savingValues = $state({})
  const originalValues = $state(clone(concept))
  const tagItems = [...gameTags]

  onMount(() => {
    selectedTags = concept.tags?.map(tag => {
      const found = gameTags.find(t => t.value === tag)
      return found ? { value: found.value, label: found.label } : { value: tag, label: tag }
    }) || []
  })

  async function onSave (field, value) {
    savingValues[field] = true

    // First save the value
    const { error } = await supabase.from('solo_concepts').update({ [field]: value }).eq('id', concept.id)
    if (error) { handleError(error) }

    if (['protagonist_names', 'world', 'plan', 'protagonist', 'locations', 'factions', 'characters', 'prompt_header_image', 'prompt_storyteller_image'].includes(field)) {
      // Differentiate between prompted and unprompted fields
      const targetField = field === 'protagonist_names' ? field : field.replace('prompt_', 'generated_')
      const requestData = { conceptId: concept.id, targetField, value }
      if (field !== 'protagonist_names') { requestData.promptField = field }
      concept.generating.push(targetField) // mark UI as generating

      // Call generation API
      const response = await fetch('/api/solo/generateField', { method: 'POST', body: JSON.stringify(requestData), headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) {
        const { error } = await response.json()
        handleError(new Error(`API error: ${error.message || 'Chyba generování pole'}`))
        concept[targetField] = '' // Reset on error
      } else {
        // Start polling for completion
        checkLoop = setInterval(async () => {
          const { data, error } = await supabase.from('solo_concepts').select().eq('id', concept.id).single()
          if (error) {
            handleError(error)
            clearInterval(checkLoop)
          }
          if (data && !data.generating.includes(targetField)) {
            concept = data // Update the full concept with server data
            savingValues[field] = false
            clearInterval(checkLoop)
            showSuccess(`Pole "${field}" bylo úspěšně aktualizováno a vygenerováno`)
            if (field === 'header_image') { window.location.reload() } // Reload to show new image
          }
        }, 5000)
      }
    } else {
      // For non-generated fields, update immediately
      originalValues[field] = value
      concept[field] = value
      savingValues[field] = false
    }
  }

  async function regenerateNames () {
    savingValues.protagonist_names = true
    const response = await fetch('/api/solo/generateField', { method: 'POST', body: JSON.stringify({ conceptId: concept.id, targetField: 'protagonist_names' }), headers: { 'Content-Type': 'application/json' } })
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

    // Delete images
    deleteStorageFolder('npcs', concept.id)
    const { error: removeError } = await supabase.storage.from('headers').remove(`solo-${concept.id}.jpg`)
    if (removeError) { return handleError(removeError) }

    window.location.href = '/solo?toastType=success&toastText=' + encodeURIComponent('Koncept byl smazán')
  }

  const maxTags = $derived(selectedTags?.length === 3)
  run(() => { tags = selectedTags?.map(tag => tag.value) || [] })
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
      <button onclick={onSave('name', concept.name)} disabled={savingValues.name || (originalValues.name === concept.name)} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Svět</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_world} loading={concept.generating.includes('generated_world')} placeholder='V jakém světě a časovém období se hra odehrává?' maxlength={1000} />
      <button onclick={() => onSave('prompt_world', concept.prompt_world)} disabled={concept.generating.includes('generated_world') || savingValues.prompt_world || originalValues.prompt_world === concept.prompt_world} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Příběh</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_plan} loading={concept.generating.includes('generated_plan')} placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' maxlength={1000} />
      <button onclick={() => onSave('prompt_plan', concept.prompt_plan)} disabled={concept.generating.includes('generated_plan') || savingValues.prompt_plan || originalValues.prompt_plan === concept.prompt_plan} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Hráčská postava</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_protagonist} loading={concept.generating.includes('generated_protagonist')} placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' maxlength={1000} />
      <button onclick={() => onSave('prompt_protagonist', concept.prompt_protagonist)} disabled={concept.generating.includes('generated_protagonist') || savingValues.prompt_protagonist || originalValues.prompt_protagonist === concept.prompt_protagonist} class='material save square' title='Uložit' use:tooltip>check</button>
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
        <button onclick={regenerateNames} class='add'>Přegenerovat</button>
        <button onclick={() => onSave('protagonist_names', concept.protagonist_names)} disabled={concept.generating.includes('protagonist_names') || savingValues.protagonist_names || originalValues.protagonist_names.join(',') === concept.protagonist_names.join(',')} class='save'>Uložit jména</button>
      </center>
    </div>

    <h2>Místa</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_locations} loading={concept.generated_locations === 'generating'} placeholder='Jaká místa jsou pro hru důležitá? (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_locations', concept.prompt_locations)} disabled={concept.generating.includes('generated_locations') || savingValues.prompt_locations || originalValues.prompt_locations === concept.prompt_locations} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Frakce</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_factions} loading={concept.generating.includes('generated_factions')} placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité? (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_factions', concept.prompt_factions)} disabled={concept.generating.includes('generated_factions') || savingValues.prompt_factions || originalValues.prompt_factions === concept.prompt_factions} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Postavy</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_characters} loading={concept.generating.includes('generated_characters')} placeholder='Jaké postavy jsou pro hru důležité? (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_characters', concept.prompt_characters)} disabled={concept.generating.includes('generated_characters') || savingValues.prompt_characters || originalValues.prompt_characters === concept.prompt_characters} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Obrázek do hlavičky</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_header_image} loading={concept.generating.includes('generated_header_image')} placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_header_image', concept.prompt_header_image)} disabled={concept.generating.includes('generated_header_image') || savingValues.prompt_header_image || originalValues.prompt_header_image === concept.prompt_header_image} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Ikonka vypravěče</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_storyteller_image} loading={concept.generating.includes('generated_storyteller_image')} placeholder='Popiš vizuálně avatar vypravěče (nepovinné)' maxlength={1000} />
      <button onclick={() => onSave('prompt_storyteller_image', concept.prompt_storyteller_image)} disabled={concept.generating.includes('generated_storyteller_image') || savingValues.prompt_storyteller_image || originalValues.prompt_storyteller_image === concept.prompt_storyteller_image} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Tagy</h2>
    <div class='row'>
      <Select items={maxTags ? [] : tagItems} multiple bind:value={selectedTags} placeholder=''>
        {#snippet empty()}<div >Více tagů nelze přidat</div>{/snippet}
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
    <h2>Anotace</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptAnnotation' name='conceptAnnotation' bind:value={concept.annotation} loading={concept.generated_annotation === 'generating'} maxlength={700} />
      <button onclick={onSave('annotation', concept.annotation)} disabled={concept.generated_annotation === 'generating' || savingValues.annotation || originalValues.annotation === concept.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>
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
