<script>
    import { supabase } from '@lib/database';
    import { showError } from '@lib/toasts';
    import { onMount } from 'svelte';
    export let user
    export let oldUserData

    let games = [];
    
    function handleGameAction(game) {
        console.log(`Button clicked for game ID: ${game.id_game}`);
        showError(`Button clicked for game ID: ${game.id_game}`)
        // Add your action handling logic here
    }

    async function getGamesByGmId(oldId) {
    const { data: gamesData, error: gamesError } = await supabase
        .from('old_games')
        .select('game_name, id_game, migrated')
        .eq('gm_id', parseInt(oldId, 10));
    if (gamesError) {
        showError('Chyba migrace: ', gamesError.message);
        return []
    }

    return gamesData;
}

    onMount(async () => {
            games = await getGamesByGmId(oldUserData.old_id);
        });


</script>

<h2>Migrace Jeskyne</h2>

<table>
    <thead>
        <tr>
            <th>Nazev hry</th>
            <th>Migrovat</th>
        </tr>
    </thead>
    <tbody>
        {#each games as game}
            {#if !game.migrated}
                <tr>
                    <td>{game.game_name}</td>
                    <td>
                        <button on:click={() => handleGameAction(game)}>
                            Migrovat
                        </button>
                    </td>
                </tr>
            {/if}
        {/each}
    </tbody>
</table>