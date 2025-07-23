<script>
  import { onMount } from 'svelte'
  import { tooltip } from '@lib/tooltip'
  import { bookmarks } from '@lib/stores'
  import { showSuccess } from '@lib/toasts'
  import { lightboxImage } from '@lib/stores'
  import { supabase, handleError, getPortraitUrl, getWorkFileUrl } from '@lib/database-browser'
  import Discussion from '@components/Discussion.svelte'
  import EditableLong from '@components/common/EditableLong.svelte'

  let { user = {}, data = $bindable({}) } = $props()

  let imageUrl = $state('')
  const bookmarkId = $derived($bookmarks.works.find(b => b.id === data.id)?.bookmark_id)
  const isOwner = user.id === data.owner.id
  const curatorIds = ['a78d91c6-3af6-4163-befd-e7b5d21d9c0f', 'c3304e31-9687-413f-a478-214c865bf5a2', '2d7898ea-ac7b-4f1b-bf29-a10c28892835', '6d3c87ea-aacc-4fd6-9859-852894fd3092'] // Sargo, Hitomi, Eskel, Eskel localhost

  onMount(() => {
    if (data.type === 'image') {
      imageUrl = getWorkFileUrl(data.content)
    }
  })

  async function addBookmark () {
    const { data: newBookmark, error } = await supabase.from('bookmarks').upsert({ user_id: user.id, work_id: data.id, work_thread: data.thread }, { onConflict: 'user_id, work_id', ignoreDuplicates: true }).select().maybeSingle()
    if (error) { return handleError(error) }
    if (newBookmark) {
      await supabase.from('read_threads').upsert({ user_id: user.id, thread_id: data.thread }, { onConflict: 'user_id, thread_id', ignoreDuplicates: true })
      await supabase.from('unread_threads').upsert({ user_id: user.id, thread_id: data.thread, unread_count: 0 }, { onConflict: 'user_id, thread_id', ignoreDuplicates: true })
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

  function showLightbox () {
    $lightboxImage = imageUrl
  }

  async function updateWorkContent () {
    const { error } = await supabase.from('works').update({ content: data.content }).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }
</script>

<main>
  {#if data.published === false}
    <div class='unpublished'><span class='material'>info</span>Toto dílo ještě není vydané, čeká na schválení</div>
  {/if}

  <div class='headline'>
    <h1>{data.name}</h1>
    {#if user.id}
      <div class='buttons'>
        {#key bookmarkId}
          <button onclick={() => { bookmarkId ? removeBookmark() : addBookmark() }} class='material bookmark square' class:active={bookmarkId} title={bookmarkId ? 'Odebrat záložku' : 'Sledovat'} use:tooltip>{bookmarkId ? 'bookmark_remove' : 'bookmark'}</button>
        {/key}
        {#if isOwner}
          <button onclick={showSettings} class='material settings square' title='Nastavení díla' use:tooltip>settings</button>
        {/if}
      </div>
    {/if}
  </div>

  {#if data.type === 'text'}
    <EditableLong {user} bind:value={data.content} onSave={updateWorkContent} canEdit={isOwner} allowHtml />
  {:else if data.type === 'image'}
    <img src={imageUrl} onclick={showLightbox} alt={data.name} class='media' />
  {:else if data.type === 'audio'}
    <audio controls src={getWorkFileUrl(data.content)} class='media'></audio>
  {/if}
  <div class='details'>
    <div class='date'>Vydáno: {new Date(data.created_at).toLocaleDateString('cs')}</div>
    <div class='author'>
      <span>Autor: </span><a href={'/user?id=' + data.owner.id} class='user'>{data.owner.name}</a>
      <img src={getPortraitUrl(data.owner.id, data.owner.portrait)} class='portrait' alt={data.owner.name} />
    </div>
  </div>

  {#if data.published === false && curatorIds.includes(user.id)}
    <div class='approve'>
      <a href='/api/work/approveWork?workId={data.id}&authorId={data.owner.id}' class='button' rel='noreferrer noopener'>Schválit</a>
    </div>
  {/if}

  <br><br>
  <Discussion {data} {user} thread={data.thread} canModerate={data.owner.id === user.id} unread={data.unread} slug={'work-' + data.id} contentSection='works' />
</main>

<style>
  .unpublished {
    display: flex;
    gap: 10px;
    padding: 20px;
    margin-bottom: 40px;
    background-color: var(--prominent);
  }
  .headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
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
  .media {
    max-width: 100%;
    display: block;
    margin: 100px auto;
    cursor: pointer;
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
  @media (max-width: 1200px) {
    .headline {
      margin-top: 20px;
    }
  }

  @media (max-width: 500px) {
    .buttons {
      display: flex;
      flex: 0.1;
      gap: 5px;
    }
      .buttons button {
        width: 35px;
        height: 35px;
        font-size: 20px;
        padding: 0px;
      }
  }
</style>
