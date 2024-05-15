<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { showSuccess } from '@lib/toasts'
  import { supabase, handleError } from '@lib/database'
  import { getSavedStore, bookmarks } from '@lib/stores'
  import Discussion from '@components/Discussion.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user = {}
  export let data = {}
  export let isMod = false

  const boardStore = getSavedStore('board-' + data.id)

  let bookmarkId

  onMount(() => {
    data.header = data.header || 'Užitečné odkazy, pravidla apod.'
  })

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
      $bookmarks.boards = [...$bookmarks.boards, { bookmark_id: newBookmark.id, id: data.id, name: data.name }]
      showSuccess('Záložka přidána')
    }
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.boards = $bookmarks.boards.filter(b => b.id !== data.id)
    showSuccess('Záložka odebrána')
  }

  $: bookmarkId = $bookmarks.boards.find(b => b.id === data.id)?.bookmark_id
</script>

<div class='headline'>
  <h1>{data.name}</h1>
  {#key $boardStore.hideHeader}
    <button on:click={toggleHeader} class='material toggleHeader square' class:active={!$boardStore.hideHeader} title={!$boardStore.hideHeader ? 'Skrýt nástěnku' : 'Zobrazit nástěnku'} use:tooltip>assignment</button>
  {/key}
  {#if user.id}
    {#key bookmarkId}
      <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark square' class:active={bookmarkId} title={bookmarkId ? 'Odebrat záložku' : 'Sledovat'} use:tooltip>{bookmarkId ? 'bookmark_remove' : 'bookmark'}</button>
    {/key}
    {#if isMod}
      <button on:click={showSettings} class='material settings square' title='Nastavení diskuze' use:tooltip>settings</button>
    {/if}
  {/if}
</div>

{#if !$boardStore.hideHeader}
  <EditableLong allowHtml userId={user.id} bind:value={data.header} onSave={updateBoardHeader} canEdit={isMod} />
  <p class='mods'>
    {#if data.mods.length}Správci:{:else}Správce:{/if}&nbsp;
    <a href={'/user?id=' + data.owner.id} class='user' title='vlastník diskuze' use:tooltip><span class='material owner'>star</span>{data.owner.name}</a>
    {#if data.mods.length}
      {#await supabase.rpc('get_user_names', { ids: data.mods }).single() then mods}
        {#each mods.data as mod}, <a href={'/user?id=' + mod.id} class='user'>{mod.name}</a>{/each}
      {/await}
    {/if}
  </p>
{/if}

<Discussion {data} {user} canModerate={isMod} unread={data.unread} thread={data.thread} slug={'board-' + data.id} contentSection={'boards'} />

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
  }
    h1 {
      flex: 1;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .headline button {
      flex-shrink: 0;
    }
  .mods {
    text-align: right;
  }
  .owner {
    font-size: 17px;
  }
</style>
