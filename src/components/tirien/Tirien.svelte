<script>
  import { supabase } from '@lib/database-browser'

  const { user, iframeSrc } = $props()

  const allowedOrigins = new Set([import.meta.env.DEV ? 'http://localhost:5173' : 'https://tirien.cz'])

  // Listen for auth sync messages from Tirien iframe
  window.addEventListener('message', async (event) => {
    if (!allowedOrigins.has(event.origin)) return
    const { type, session } = event.data ?? {}
    if (type !== 'tirien-auth-sync' || !session?.access_token || !session?.refresh_token) return
    try {
      await supabase.auth.setSession(session)
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token })
      })
    } catch (syncError) {
      console.error('Failed to sync session from Tirien iframe:', syncError)
    }
  })
</script>

{#if user.id}
  <div class='tirien-iframe-container'>
    <iframe src={iframeSrc} width='100%' height='100%' frameborder='0' allow='autoplay; encrypted-media; fullscreen'></iframe>
  </div>
{:else}
  <center>Tato sekce je jen pro přihlášené uživatele</center>
{/if}

<style>
  .tirien-iframe-container {
    width: 100%;
    height: 100%;
    overlay: hidden;
  }
</style>
