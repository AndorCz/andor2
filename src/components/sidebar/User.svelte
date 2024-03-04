<script>
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import { supabase, uploadPortrait } from '@lib/database'
  import { activeConversation } from '@lib/stores'

  export let user = {}

  async function onPortraitChange (file) {
    uploadPortrait(user.id, 'profiles', file)
  }

  async function logout () {
    $activeConversation = null
    document.cookie = 'sb-access-token=; Max-Age=-99999999;'
    document.cookie = 'sb-refresh-token=; Max-Age=-99999999;'
    await supabase.auth.signOut()
    window.location.href = '/api/auth/logout'
  }
</script>

<div id='user'>
  <PortraitInput {onPortraitChange} identity={user} table='profiles' displayWidth={70} displayHeight={100} /><br>
  <div id='details'>
    <div id='nameRow'>
      <span id='name'>{user.name || user.email}</span>
    </div>
    <div>
      <button on:click={logout} id='logout' class='material' title='odhlásit'>logout</button>
    </div>
  </div>
</div>

<style>

#user {
    padding: 20px 0px;
    display: flex;
    gap: 10px;
  }
    #details {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #nameRow {
      flex: 1;
      display: flex;
      align-items: center;
    }
      #name {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    #logout {
      padding: 0px;
      padding: 5px;
    }
</style>
