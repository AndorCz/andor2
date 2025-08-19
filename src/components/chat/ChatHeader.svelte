<script>
  import { onMount } from 'svelte'
  import { initToasts } from '@lib/toasts'

  onMount(() => {
    initToasts()
  })
</script>

<ul id='header'>
  <li><a href='/'><span class='material'>star</span><span>Nové</span></a></li>
  <li><a href='/games'><span class='material'>casino</span><span>Hry</span></a></li>
  <li><a href='/solo'><span class='material'>robot_2</span><span>AI</span></a></li>
  <li><a href='/works'><span class='material'>edit</span><span>Tvorba</span></a></li>
  <li><a href='/boards'><span class='material'>forum</span><span>Diskuze</span></a></li>
</ul>

<style>
  #header {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    padding: 15px;
    margin: 0px;
    z-index: 999;
    background-color: var(--panel);
    box-shadow: 2px 2px 4px 0px #00000040;
    display: flex;
    gap: 20px;
  }
    #header li {
      list-style-type: none;
    }
      #header li a {
        display: flex;
        gap: 10px;
        align-items: center;
        text-decoration: none;
      }
  @media (max-width: 530px) {
    #header {
      padding: 10px;
      gap: 10px;
      justify-content: center;
    }
      #header li a {
        font-size: 14px;
      }
    #header li a span.material {
      font-size: 20px;
    }
  }
</style>
