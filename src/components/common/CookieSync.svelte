<script>
  import { getCookie } from '@lib/browser/utils'

  const accessToken = getCookie('sb-access-token')
  const refreshToken = getCookie('sb-refresh-token')
  const tirienDomain = window.location.hostname === 'localhost' ? 'http://localhost:2345' : 'https://tirien.cz'
</script>

{#if accessToken && refreshToken}
  <iframe src={`${tirienDomain}/cookies/save.html?name=sb-access-token,sb-refresh-token&data=${encodeURIComponent(accessToken)},${encodeURIComponent(refreshToken)}&time=31536000,31536000`}></iframe>
{/if}

<style>
  iframe {
    display: none;
  }
</style>
