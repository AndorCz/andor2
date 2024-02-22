<script>
  import GameList from '@components/games/GameList.svelte'
  import WorkList from '@components/works/WorkList.svelte'
  import BoardList from '@components/boards/BoardList.svelte'

  export let user = {}
  export let data = {}
</script>

<content>
  <main>
    <h1>{user.name}</h1>
    <p>Uživatel od: {new Date(user.created_at).toLocaleDateString('cs')}</p>
  </main>
  <aside>
    {#if user.portrait}
    <img src={user.portrait} alt={user.name} id='portrait' />
  {/if}
  </aside>
</content>

<h2>Hry</h2>
<GameList {user} games={data.games} />

<h2>Díla</h2>
<WorkList {user} works={data.works} />

<h2>Diskuze</h2>
<BoardList {user} boards={data.boards} />

<style>
  content {
    display: flex;
    justify-content: space-between;
  }
  main {
    flex: 1;
  }
  #portrait {
    border-radius: 10px;
  }
</style>
