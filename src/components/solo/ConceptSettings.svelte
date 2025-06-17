<script>
  import EditableLong from '@components/common/EditableLong.svelte'
  import { supabase, handleError } from '@lib/database-browser'

  export let concept
  export let user

  async function onSave (value) {
    // Save the updated concept data
    const { error } = await supabase.from('solo_concepts').update({
      story_world: concept.story_world,
      story_factions: concept.story_factions,
      story_locations: concept.story_locations,
      story_characters: concept.story_characters,
      story_protagonist: concept.story_protagonist,
      story_plan: concept.story_plan
    }).eq('id', concept.id)
    if (error) { return handleError(error) }
  }
</script>

<div class='spoilers'>
  <h2>Svět</h2>
  <EditableLong {user} value={concept.story_world} {onSave} canEdit allowHtml />
  <h2>Frakce</h2>
  <EditableLong {user} value={concept.story_factions} {onSave} canEdit allowHtml />
  <h2>Místa</h2>
  <EditableLong {user} value={concept.story_locations} {onSave} canEdit allowHtml />
  <h2>Postavy</h2>
  <EditableLong {user} value={concept.story_characters} {onSave} canEdit allowHtml />
  <h2>Protagonista</h2>
  <EditableLong {user} value={concept.story_protagonist} {onSave} canEdit allowHtml />
  <h2>Plán hry</h2>
  <EditableLong {user} value={concept.story_plan} {onSave} canEdit allowHtml />
</div>

<style>
</style>
