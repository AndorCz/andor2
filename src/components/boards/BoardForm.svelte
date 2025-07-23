<script>
  import { preventSubmit } from '@lib/utils'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'

  const { user = {} } = $props()
</script>

<h1>Vytvořit diskuzi</h1>

{#if user.id}
  <form method='POST' autocomplete='off'>
    <div class='row'>
      <div class='labels'><label for='boardName'>Název</label></div>
      <div class='inputs'><input type='text' id='boardName' name='boardName' maxlength='80' onkeydown={preventSubmit} /></div>
    </div>

    <div class='row'>
      <div class='labels'><label for='boardAnnotation'>Anotace</label></div>
      <div class='inputs'><TextareaExpandable placeholder='Popis tématu, do seznamu diskuzí a novinek' {user} id='boardAnnotation' name='boardAnnotation' minHeight={80} maxlength={150} /></div>
    </div>

    <center>
      <button type='submit' class='large'>Vytvořit</button>
    </center>
  </form>
{:else}
  <div>
    <p>Pro vytvoření nové diskuze se musíš přihlásit.</p>
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
