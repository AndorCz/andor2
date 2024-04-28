<script>
    import { supabase } from '@lib/database';
    import { showError } from '@lib/toasts';
    import { onMount } from 'svelte';
    export let oldUserData

    let games = [];
    const migratingGames = new Set();

    async function handleGameAction(game_id) {
        if (game_id) {
            migratingGames.add(game_id);
            games = games.slice();
            try {
                const response = await fetch('/api/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({action:'migrate_game', gameId: game_id})
                });

                const result = await response.json();
                if (result.status == 202) {
                    showSuccess("Probíha migrace - může chvíli trvat")
                    migratingGames.add(game_id)
                    games = games.slice();
                } else {
                    showError('API failed to migrate');
                }
            } catch (error) {
                console.error('Error calling API:', error.toString());
            }
        } else {
            showError('Chyba - hra nenalezenena');
        }
    }

    async function getGamesByGmId(oldId) {
    const { data: gamesData, error: gamesError } = await supabase
        .from('old_games')
        .select('game_name, id_game, migrated, migrating')
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
                <tr>
                    <td>{game.game_name}</td>
                    <td>
                        {#if game.migrated}
                            <button disabled>Hotovo!</button>
                        {:else if game.migrating || migratingGames.has(game.id_game)}
                            <button disabled>Probíha migrace</button>
                        {:else}
                            <button on:click={() => handleGameAction(game.id_game)}>
                                Migrovat
                            </button>
                        {/if}
                    </td>
                </tr>
        {/each}
    </tbody>
</table>