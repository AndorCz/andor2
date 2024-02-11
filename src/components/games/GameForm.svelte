<script>
  import { systems, categories } from '@lib/constants'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  export let user = {}
</script>

{#if user.id}
  <form method='POST' autocomplete='off'>
    <div class='row'>
      <div class='labels'>
        <label for='gameName'>Název</label>
      </div>
      <div class='inputs'>
        <input type='text' id='gameName' name='gameName' maxlength='80' />
      </div>
    </div>

    <div class='row'>
      <div class='labels'>
        <label for='gameSystem'>Kategorie</label>
      </div>
      <div class='inputs'>
        <select id='gameCategory' name='gameCategory'>
          {#each categories as category}
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
          {#each systems as system}
            <option value={system.value}>{system.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class='row'>
      <div class='labels'><label for='gameAnnotation'>Anotace</label></div>
      <div class='inputs'><TextareaExpandable id='gameAnnotation' name='gameAnnotation' /></div>
    </div>

    <center>
      <button type='submit' class='large' onclick='this.disabled=true; this.form.submit()'>Vytvořit</button>
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
