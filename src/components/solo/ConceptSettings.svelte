<script>
  import { tooltip } from '@lib/tooltip'
  import { gameTags } from '@lib/constants'
  import { showSuccess } from '@lib/toasts'
  import { onMount, onDestroy } from 'svelte'
  import { supabase, handleError } from '@lib/database-browser'
  import Select from 'svelte-select'
  import EditableLong from '@components/common/EditableLong.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let concept
  export let user

  let tags
  let checkLoop
  let headlineEl
  let selectedTags
  let tab = 'prompts'
  let originalValues = { tags: [] }
  const savingValues = {}
  const tagItems = [...gameTags]

  onMount(() => {
    originalValues = { ...concept }
    selectedTags = concept.tags?.map(tag => {
      const found = gameTags.find(t => t.value === tag)
      return found ? { value: found.value, label: found.label } : { value: tag, label: tag }
    }) || []
  })

  async function onSave (field, value) {
    savingValues['prompt_' + field] = true

    // Just save the prompt value
    const { error } = await supabase.from('solo_concepts').update({ ['prompt_' + field]: value }).eq('id', concept.id)
    if (error) {
      savingValues['prompt_' + field] = false
      return handleError(error)
    }

    // If this field should trigger generation, call the API
    if (['world', 'plan', 'protagonist', 'locations', 'factions', 'characters', 'image'].includes(field)) {
      // Mark UI as generating
      concept['generated_' + field] = 'generating'

      // Call generation API
      const response = await fetch('/api/solo/generateField', { method: 'POST', body: JSON.stringify({ conceptId: concept.id, field, value }), headers: { 'Content-Type': 'application/json' } })

      if (!response.ok) {
        const { error } = await response.json()
        handleError(new Error(`API error: ${error.message || 'Chyba generování pole'}`))
        concept['generated_' + field] = '' // Reset on error
        savingValues['prompt_' + field] = false
        return
      }

      // Start polling for completion
      checkLoop = setInterval(async () => {
        const { data, error } = await supabase.from('solo_concepts').select().eq('id', concept.id).single()
        if (error) {
          handleError(error)
          clearInterval(checkLoop)
          return
        }

        if (data && !data.generating) {
          concept = data // Update the full concept with server data
          savingValues['prompt_' + field] = false
          clearInterval(checkLoop)
          showSuccess('Pole "' + field + '" bylo úspěšně aktualizováno a vygenerováno')
        }
      }, 5000)
    } else {
      // For non-generated fields, update immediately
      savingValues['prompt_' + field] = false
      originalValues['prompt_' + field] = value
      concept['prompt_' + field] = value
    }
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
    window.location.href = '/solo?toastType=success&toastText=' + encodeURIComponent('Koncept byl smazán')
  }

  $: maxTags = selectedTags?.length === 3
  $: tags = selectedTags?.map(tag => tag.value) || []
</script>

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/solo/concept/{concept.id}' class='backlink'>{concept.name}</a>
    <h1>Nastavení</h1>
    <button on:click={showConcept} class='material square back' title='Zpět na koncept' use:tooltip>arrow_back</button>
  </div>
</div>

<nav class='tabs secondary'>
  <button on:click={() => { tab = 'prompts' }} class={tab === 'prompts' ? 'active' : ''}>Uživatelské vstupy</button>
  <button on:click={() => { tab = 'generated' }} class={tab === 'generated' ? 'active' : ''}>Generované podklady (spoiler)</button>
</nav>

<main>
  {#if tab === 'prompts'}
    <h2>Název</h2>
    <div class='row'>
      <input type='text' bind:value={concept.name} maxlength='80' />
      <button on:click={onSave('name', concept.name)} disabled={savingValues.name || (originalValues.name === concept.name)} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Svět</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_world} loading={concept.generated_world === 'generating'} placeholder='V jakém světě a časovém období se hra odehrává?' maxlength={1000} />
      <button on:click={() => onSave('world', concept.prompt_world)} disabled={concept.generated_world === 'generating' || savingValues.prompt_world || originalValues.prompt_world === concept.prompt_world} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Příběh</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_plan} loading={concept.generated_plan === 'generating'} placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' maxlength={1000} />
      <button on:click={() => onSave('plan', concept.prompt_plan)} disabled={concept.generated_plan === 'generating' || savingValues.prompt_plan || originalValues.prompt_plan === concept.prompt_plan} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Protagonista</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_protagonist} loading={concept.generated_protagonist === 'generating'} placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' maxlength={1000} />
      <button on:click={() => onSave('protagonist', concept.prompt_protagonist)} disabled={concept.generated_protagonist === 'generating' || savingValues.prompt_protagonist || originalValues.prompt_protagonist === concept.prompt_protagonist} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Místa</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_locations} loading={concept.generated_locations === 'generating'} placeholder='Jaká místa jsou pro hru důležitá? (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('locations', concept.prompt_locations)} disabled={concept.generated_locations === 'generating' || savingValues.prompt_locations || originalValues.prompt_locations === concept.prompt_locations} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Frakce</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_factions} loading={concept.generated_factions === 'generating'} placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité? (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('factions', concept.prompt_factions)} disabled={concept.generated_factions === 'generating' || savingValues.prompt_factions || originalValues.prompt_factions === concept.prompt_factions} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Postavy</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_characters} loading={concept.generated_characters === 'generating'} placeholder='Jaké postavy jsou pro hru důležité? (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('characters', concept.prompt_characters)} disabled={concept.generated_characters === 'generating' || savingValues.prompt_characters || originalValues.prompt_characters === concept.prompt_characters} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Ilustrace</h2>
    <div class='row'>
      <TextareaExpandable {user} bind:value={concept.prompt_image} loading={concept.generated_image === 'generating'} placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('image', concept.prompt_image)} disabled={concept.generated_image === 'generating' || savingValues.prompt_image || originalValues.prompt_image === concept.prompt_image} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Tagy</h2>
    <div class='row'>
      <Select items={maxTags ? [] : tagItems} multiple bind:value={selectedTags} placeholder=''>
        <div slot='empty'>Více tagů nelze přidat</div>
      </Select>
      <button on:click={saveTags} disabled={ savingValues.tags || originalValues.tags.join(',') === tags.join(',')} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Smazání konceptu</h2>
    Pozor, toto je nevratná akce<br><br>
    <button class='delete' on:click={() => { if (confirm('Opravdu chcete smazat tento koncept?')) { deleteConcept() } }}>
      <span class='material'>warning</span><span>Smazat koncept hry</span>
    </button>
  {/if}
  {#if tab === 'generated'}
    <h2>Anotace</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptAnnotation' name='conceptAnnotation' bind:value={concept.annotation} loading={concept.generated_annotation === 'generating'} maxlength={700} />
      <button on:click={onSave('annotation', concept.annotation)} disabled={concept.generated_annotation === 'generating' || savingValues.annotation || originalValues.annotation === concept.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
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
    <h2>Ilustrace</h2>
    <EditableLong {user} value={concept.generated_image} onSave={(value) => onSave('generated_image', value)} canEdit allowHtml />
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
