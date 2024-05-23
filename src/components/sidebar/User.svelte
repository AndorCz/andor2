<script>
  import PortraitInput from '@components/common/PortraitInput.svelte'
  import { activeConversation } from '@lib/stores'
  import { uploadPortrait } from '@lib/utils'
  import { supabase } from '@lib/database-browser'
  import { tooltip } from '@lib/tooltip'

  export let user = {}

  async function onPortraitChange (file) {
    await uploadPortrait(supabase, user.id, 'profiles', file)
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
      <a href={'/user?id=' + user.id} id='name' class='user'>{user.name || user.email}</a>
    </div>
    <div id='buttons'>
      <a href='/settings' id='settings' class='button material' title='Nastavení' use:tooltip>settings</a>
      <button on:click={logout} id='logout' class='material' title='Odhlásit' use:tooltip>logout</button>
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
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    #buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
      #logout, #settings {
        padding: 0px;
        padding: 5px;
      }
</style>
