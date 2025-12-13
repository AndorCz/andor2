<script>
  // Get all cookies that match the Supabase auth token pattern
  // This handles both single cookies (sb-xxx-auth-token) and chunked cookies (sb-xxx-auth-token.0, .1, etc.)
  const allCookies = document.cookie.split(';').map(c => c.trim())
  const authCookies = allCookies
    .filter(c => c.startsWith('sb-') && c.includes('-auth-token'))
    .map(cookie => {
      const [name, ...valueParts] = cookie.split('=')
      return { name: name.trim(), value: valueParts.join('=') }
    })

  const tirienDomain = window.location.hostname === 'localhost' ? 'http://localhost:2345' : 'https://tirien.cz'

  // Build URL parameters for save.html
  let saveUrl = null
  if (authCookies.length > 0) {
    const names = authCookies.map(c => c.name).join(',')
    const values = authCookies.map(c => encodeURIComponent(c.value)).join(',')
    const times = authCookies.map(() => '31536000').join(',') // 1 year for all
    saveUrl = `${tirienDomain}/cookies/save.html?name=${names}&data=${values}&time=${times}`
  }
</script>

{#if saveUrl}
  <iframe src={saveUrl}></iframe>
{/if}

<style>
  iframe {
    display: none;
  }
</style>
