<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { supabase, handleError } from '@lib/database-browser'
  import EditableLong from '@components/common/EditableLong.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let concept
  export let user

  let headlineEl
  let tab = 'basics'
  let originalValues = {}
  const savingValues = {}

  onMount(() => {
    originalValues = { ...concept }
  })

  async function onSave (field, value) {
    savingValues[field] = true
    const conceptData = { ...concept }
    conceptData[field] = value // update the specific field
    delete conceptData.id // remove ID to avoid conflicts
    const { error } = await supabase.from('solo_concepts').update(conceptData).eq('id', concept.id)
    if (error) { return handleError(error) }
    savingValues[field] = false
    originalValues[field] = value // update original values after saving
    concept[field] = value // update the concept object with the new value
  }

  function showConcept () {
    window.location.href = `/solo/${concept.id}`
  }

</script>

<div class='headline' bind:this={headlineEl}>
  <div class='wrapper'>
    <a href='/solo/{concept.id}' class='backlink'>{concept.name}</a>
    <h1>Nastavení</h1>
    <button on:click={showConcept} class='material square back' title='Zpět na koncept' use:tooltip>check</button>
  </div>
</div>

<nav class='tabs secondary'>
  <button on:click={() => { tab = 'basics' }} class={tab === 'basics' ? 'active' : ''}>Uživatelské vstupy</button>
  <button on:click={() => { tab = 'advanced' }} class={tab === 'advanced' ? 'active' : ''}>Generované podklady (spoiler)</button>
</nav>

<main>
  {#if tab === 'basics'}
    <h2>Název</h2>
    <div class='row'>
      <input type='text' id='conceptName' name='conceptName' bind:value={concept.name} maxlength='80' />
      <button on:click={onSave('name', concept.name)} disabled={savingValues.name || (originalValues.name === concept.name)} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Svět</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptWorld' name='conceptWorld' bind:value={concept.prompt_world} placeholder='V jakém světě a časovém období se hra odehrává?' maxlength={1000} />
      <button on:click={() => onSave('prompt_world', concept.prompt_world)} disabled={savingValues.prompt_world || originalValues.prompt_world === concept.prompt_world} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Příběh</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptStory' name='conceptStory' bind:value={concept.prompt_story} placeholder='O čem hra bude? Stačí hlavní zápletka nebo motiv.' maxlength={1000} />
      <button on:click={() => onSave('prompt_story', concept.prompt_story)} disabled={savingValues.prompt_story || originalValues.prompt_story === concept.prompt_story} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Protagonista</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptProtagonist' name='conceptProtagonist' bind:value={concept.prompt_protagonist} placeholder='Koho hráč hraje? Je něčím omezen výběr postavy?' maxlength={1000} />
      <button on:click={() => onSave('prompt_protagonist', concept.prompt_protagonist)} disabled={savingValues.prompt_protagonist || originalValues.prompt_protagonist === concept.prompt_protagonist} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Místa</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptLocations' name='conceptLocations' bind:value={concept.prompt_locations} placeholder='Jaká místa jsou pro hru důležitá? (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('prompt_locations', concept.prompt_locations)} disabled={savingValues.prompt_locations || originalValues.prompt_locations === concept.prompt_locations} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Frakce</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptFactions' name='conceptFactions' bind:value={concept.prompt_factions} placeholder='Jaké frakce, organizace nebo skupiny jsou ve hře důležité? (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('prompt_factions', concept.prompt_factions)} disabled={savingValues.prompt_factions || originalValues.prompt_factions === concept.prompt_factions} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Postavy</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptCharacters' name='conceptCharacters' bind:value={concept.prompt_characters} placeholder='Jaké postavy jsou pro hru důležité? (nepovinné)' maxlength={1000} />
      <button on:click={() => onSave('prompt_characters', concept.prompt_characters)} disabled={savingValues.prompt_characters || originalValues.prompt_characters === concept.prompt_characters} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>

    <h2>Ilustrace</h2>
    <div class='row'>
      <TextareaExpandable {user} id='conceptImage' name='conceptImage' bind:value={concept.prompt_image} placeholder='Popiš vizuálně obrázek který by hru nejlépe vystihoval (nepovinné)' maxlength={500} />
      <button on:click={() => onSave('prompt_image', concept.prompt_image)} disabled={savingValues.prompt_image || originalValues.prompt_image === concept.prompt_image} class='material save square' title='Uložit' use:tooltip>check</button>
    </div>
  {/if}
  {#if tab === 'advanced'}
    <div class='spoilers'>
      <h2>Anotace</h2>
      <div class='row'>
        <TextareaExpandable {user} id='conceptAnnotation' name='conceptAnnotation' bind:value={concept.annotation} maxlength={700} />
        <button on:click={onSave('annotation', concept.annotation)} disabled={savingValues.annotation || originalValues.annotation === concept.annotation} class='material save square' title='Uložit' use:tooltip>check</button>
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
    </div>
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
