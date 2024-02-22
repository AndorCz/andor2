<script>
  import GameList from '@components/games/GameList.svelte'
  import WorkList from '@components/works/WorkList.svelte'
  import BoardList from '@components/boards/BoardList.svelte'

  export let user = {}
  export let data = {}
</script>

<section>
  <main>
    <h1>{data.name}</h1>
    <p>Uživatel od: {new Date(data.created_at).toLocaleDateString('cs')}</p>
  </main>
  <aside>
    {#if data.portrait}
    <img src={data.portrait} alt={data.name} id='portrait' />
  {/if}
  </aside>
</section>

<h2>Hry</h2>
<GameList {user} games={data.games} />

<h2>Díla</h2>
<WorkList {user} works={data.works} />

<h2>Diskuze</h2>
<BoardList {user} boards={data.boards} />

<style>
  section {
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
