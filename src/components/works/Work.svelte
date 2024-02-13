<script>
  import { supabase, handleError } from '@lib/database'
  import { bookmarks } from '@lib/stores'
  import { showSuccess } from '@lib/toasts'
  import Discussion from '@components/Discussion.svelte'
  import TextareaExpandable from '@components/common/TextareaExpandable.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user = {}
  export let data = {}

  const isAuthor = user.id === data.author.id
  let editing = false
  let bookmarkId
  let editorRef

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').upsert({ user_id: user.id, game_id: data.id }, { onConflict: 'user_id, game_id', ignoreDuplicates: true }).select().maybeSingle()
    if (error) { return handleError(error) }
    if (newBookmark) {
      $bookmarks.games = [...$bookmarks.games, { id: newBookmark.id, game_id: data.id, name: data.name }]
      showSuccess('Záložka přidána')
    }
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.games = $bookmarks.games.filter(b => b.game_id !== data.id)
    showSuccess('Záložka odebrána')
  }

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  $: bookmarkId = $bookmarks.works.find(b => b.work_id === data.id)?.id
</script>

<main>
  <div class='headline'>
    <h1>{data.name}</h1>
    {#if user.id}
      <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark' class:active={bookmarkId} title='Sledovat'>bookmark</button>
      {#if isAuthor}
        <button on:click={showSettings} class='material settings' title='Nastavení'>settings</button>
      {/if}
    {/if}
  </div>

  <!--
  {#if editing}
    <TextareaExpandable bind:this={editorRef} allowHtml minHeight={500} value={data.content} />
  {:else}
    <div class='work'>{@html data.content}</div>
  {/if}
  {#if isAuthor}
    <button on:click={() => { editing = !editing }} class='material edit' title='Upravit'>edit</button>
  {/if}
  -->
  <EditableLong value={data.content} onSave={async () => {}} canEdit={isAuthor} allowHtml />
  <br><br>
  <Discussion {data} {user} thread={data.thread} isOwner={data.author.id === user.id} unread={data.unread} />
</main>

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
    h1 {
      margin: 0px;
      flex: 1;
    }
    .headline button {
      padding: 10px;
      margin-left: 10px;
    }
    .headline button.active {
      background-color: var(--panel);
      border: 1px var(--panel) solid;
      box-shadow: inset 2px 2px 2px #0003;
    }
  .work {
    margin-bottom: 50px;
  }
</style>
