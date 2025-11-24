<script>
  import { preventSubmit } from '@lib/utils'
  import { gameSystems, gameCategories } from '@lib/constants'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user, aiEnabled = false } = $props()
</script>

{#if user.id}
  <form method='POST' autocomplete='off'>
    {#if aiEnabled}
      <input type='hidden' name='aiEnabled' value='true' />
    {/if}
    <div class='row'>
      <div class='labels'>
        <label for='gameName'>Název *</label>
      </div>
      <div class='inputs'>
        <input type='text' id='gameName' name='gameName' maxlength='80' onkeydown={preventSubmit} />
      </div>
    </div>

    <div class='row'>
      <div class='labels'>
        <label for='gameSystem'>Kategorie</label>
      </div>
      <div class='inputs'>
        <select id='gameCategory' name='gameCategory'>
          {#each gameCategories as category (category.value)}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class='row'>
      <div class='labels'>
        <label for='gameSystem'>Herní systém</label>
      </div>
      <div class='inputs'>
        <select id='gameSystem' name='gameSystem'>
          {#each gameSystems as system (system.value)}
            <option value={system.value}>{system.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='gameAnnotation'>Anotace</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Popis světa, úvod do příběhu apod.' {user} id='gameAnnotation' name='gameAnnotation' minHeight={80} maxlength={150} /></div>
    </div>

    <center>
      <button type='submit' class='large'>Vytvořit</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nové hry se musíš přihlásit.</p>
  </div>
{/if}

<style>
  form {
    width: 100%;
  }
    .row {
      display: flex;
      margin-top: 30px;
      margin-bottom: 30px;
    }
      .labels {
        width: 15%;
        padding-top: 15px;
      }
      .inputs {
        flex: 1;
      }
        input {
          width: 100%;
        }
        select {
          width: 400px;
        }
  center {
    margin-top: 20px;
  }
  @media (max-width: 860px) {
    .row {
      display: block;
    }
      .labels {
        width: 100%;
        padding-bottom: 20px;
      }
  }
</style>
