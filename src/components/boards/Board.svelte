<script>
  import { getSavedStore, bookmarks } from '@lib/stores'
  import { supabase, handleError } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import Discussion from '@components/Discussion.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user = {}
  export let data = {}

  const boardStore = getSavedStore('board-' + data.id)
  const isBoardOwner = data.owner.id === user.id

  let bookmarkId

  function toggleHeader () {
    $boardStore.hideHeader = !$boardStore.hideHeader
  }

  async function updateBoardHeader () {
    const { error } = await supabase.from('boards').update({ header: data.header }).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').upsert({ user_id: user.id, board_id: data.id }, { onConflict: 'user_id, board_id', ignoreDuplicates: true }).select().maybeSingle()
    if (error) { return handleError(error) }
    if (newBookmark) {
      $bookmarks.boards = [...$bookmarks.boards, { id: newBookmark.id, board_id: data.id, name: data.name }]
      showSuccess('Záložka přidána')
    }
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.boards = $bookmarks.boards.filter(b => b.board_id !== data.id)
    showSuccess('Záložka odebrána')
  }

  $: bookmarkId = $bookmarks.boards.find(b => b.board_id === data.id)?.id
</script>

<div class='headline'>
  <h1>{data.name}</h1>
  <button on:click={toggleHeader} class='material toggleHeader' class:active={!$boardStore.hideHeader} title={!$boardStore.hideHeader ? 'Skrýt nástěnku' : 'Zobrazit nástěnku'}>assignment</button>
  {#if user.id}
    <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark' class:active={bookmarkId} title='Sledovat'>bookmark</button>
    {#if isBoardOwner}
      <button on:click={showSettings} class='material settings' title='Nastavení'>settings</button>
    {/if}
  {/if}
</div>

{#if !$boardStore.hideHeader}
  <EditableLong userId={user.id} bind:value={data.header} onSave={updateBoardHeader} canEdit={isBoardOwner} />
{/if}

<Discussion {data} {user} isOwner={isBoardOwner} unread={data.unread} thread={data.thread} slug={'board-' + data.id} />

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
</style>
