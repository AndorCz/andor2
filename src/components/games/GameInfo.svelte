<script>
  import { onMount } from 'svelte'
  import { supabase, handleError, setRead } from '@lib/database'
  import { showSuccess } from '@lib/toasts'
  import EditableLong from '@components/common/EditableLong.svelte'

  export let user
  export let data
  export let isStoryteller

  onMount(() => {
    if (user.id) {
      delete data.unread.gameInfo
      setRead(user.id, 'game-info-' + data.id)
    }
  })

  async function updateGameInfo (publicChange = true) {
    const newData = { info: data.info }
    if (publicChange) { newData.info_changed_at = new Date() }
    const { error } = await supabase.from('games').update(newData).eq('id', data.id)
    if (error) { return handleError(error) }
    showSuccess('Uloženo')
  }
</script>

<main>
  {#if data.open_info}
    <EditableLong userId={user.id} bind:value={data.info} onSave={updateGameInfo} canEdit={isStoryteller} enterSend={false} allowHtml />
  {:else}
    <p>Informace o hře nejsou veřejné</p>
  {/if}
  <br><br>
  Správce hry: {data.owner.name}
</main>

<style>
  main {
    padding-top: 40px;
  }
</style>
