<script>
  import { supabase } from '@lib/database-browser'
  import { showError } from '@lib/toasts'

  let { user = $bindable() } = $props()
  const open = $derived.by(() => user && user.publish_consent === null)

  async function setConsent (value) {
    const { error } = await supabase.from('profiles').update({ publish_consent: value }).eq('id', user.id)
    if (error) { return showError(error.message) }
    user.publish_consent = value
  }
</script>

{#if open}
  <div id='consentVeil'></div>
  <div id='consentModal'>
    <p>Souhlasíš s publikováním tvých příspěvků z veřejných her na hlavní stránce a sociálních sítích pod jménem tvé postavy?<br>Tuto volbu můžeš později kdykoliv změnit v uživatelském nastavení.</p>
    <div class='buttons'>
      <button onclick={() => setConsent(true)}>Souhlasím</button>
      <button onclick={() => setConsent(false)}>Nesouhlasím</button>
    </div>
  </div>
{/if}

<style>
  #consentVeil {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #000;
    opacity: 0.5;
    z-index: 999;
  }
  #consentModal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel);
    padding: 20px;
    border-radius: 10px;
    z-index: 1000;
    max-width: 500px;
  }
    #consentModal .buttons {
      margin-top: 20px;
      display: flex;
      gap: 20px;
      justify-content: center;
    }
</style>
