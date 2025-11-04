<script>
  import { tooltip } from '@lib/tooltip'
  import { supabase } from '@lib/database-browser'
  import { uploadPortrait } from '@lib/utils'
  import { activeConversation } from '@lib/stores'
  import PortraitInput from '@components/common/PortraitInput.svelte'

  const { user = {} } = $props()

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
  <PortraitInput {onPortraitChange} identity={user} showDelete={false} table='profiles' displayWidth={70} displayHeight={90} /><br>
  <div id='details'>
    <div id='nameRow'>
      <a href={'/user?id=' + user.id} id='name' class='user'>{user.name || user.email}</a>
    </div>
    <div id='buttons'>
      <a href='/settings' id='settings' class='button material square' title='Nastavení' use:tooltip>settings</a>
      <a href='/search' id='search' class='button material square' title='Vyhledat v konverzacích' use:tooltip>search</a>
      <button onclick={logout} id='logout' class='material square' title='Odhlásit' use:tooltip>logout</button>
    </div>
  </div>
</div>

<style>
  #user {
    margin: 20px 0px;
    display: flex;
    gap: 10px;
  }
    #details {
      display: flex;
      flex-direction: column;
    }
    #nameRow {
      padding: 15px 0px;
    }
      #name {
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    #buttons {
      display: flex;
      gap: 10px;
    }
      #logout, #settings, #search {
        padding: 0px;
        padding: 5px;
      }
</style>
