<script>
  import { tooltip } from '@lib/tooltip'
  import { supabase, handleError, getPortraitUrl } from '@lib/database-browser'
  import { bookmarks } from '@lib/stores'
  import { showSuccess } from '@lib/toasts'
  import Discussion from '@components/Discussion.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user = {}
  export let data = {}

  const isOwner = user.id === data.owner.id
  let bookmarkId

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').upsert({ user_id: user.id, work_id: data.id }, { onConflict: 'user_id, work_id', ignoreDuplicates: true }).select().maybeSingle()
    if (error) { return handleError(error) }
    if (newBookmark) {
      $bookmarks.works = [...$bookmarks.works, { bookmark_id: newBookmark.id, id: data.id, name: data.name }]
      showSuccess('Záložka přidána')
    }
  }

  async function removeBookmark () {
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    if (error) { return handleError(error) }
    $bookmarks.works = $bookmarks.works.filter(b => b.id !== data.id)
    showSuccess('Záložka odebrána')
  }

  function showSettings () {
    window.location.href = `${window.location.pathname}?settings=true`
  }
  async function updateWorkContent () {
    const { error } = await supabase.from('works').update({ content: data.content }).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }

  // function getTags (value) {
  //   return value.map(tag => workTags.find(t => t.value === tag).label).join(', ')
  // }

  $: bookmarkId = $bookmarks.works.find(b => b.id === data.id)?.bookmark_id
</script>

<main>
  <div class='headline'>
    <h1>{data.name}</h1>
    {#if user.id}
      {#key bookmarkId}
        <button on:click={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark square' class:active={bookmarkId} title={bookmarkId ? 'Odebrat záložku' : 'Sledovat'} use:tooltip>{bookmarkId ? 'bookmark_remove' : 'bookmark'}</button>
      {/key}
      {#if isOwner}
        <button on:click={showSettings} class='material settings square' title='Nastavení díla' use:tooltip>settings</button>
      {/if}
    {/if}
  </div>

  <EditableLong userId={user.id} bind:value={data.content} onSave={updateWorkContent} canEdit={isOwner} allowHtml />
  <div class='details'>
    <div class='date'>Vydáno: {new Date(data.created_at).toLocaleDateString('cs')}</div>
    <div class='author'>
      Autor: <a href={'/user?id=' + data.owner.id} class='user'>{data.owner.name}</a>
      <img src={getPortraitUrl(data.owner.id, data.owner.portrait)} class='portrait' alt={data.owner.name} />
    </div>
  </div>

  <br><br>
  <Discussion {data} {user} thread={data.thread} canModerate={data.owner.id === user.id} unread={data.unread} slug={'work-' + data.id} contentSection={'works'} />
</main>

<style>
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
  }
    h1 {
      margin: 0px;
      flex: 1;
    }
  .details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
  }
  .author {
    display: flex;
    align-items: center;
    gap: 10px;
  }
    .portrait {
      display: block;
      width: 60px;
      height: 60px;
      object-fit: cover;
      object-position: center 20%;
      border-radius: 100%;
      background-color: var(--background);
    }
</style>
