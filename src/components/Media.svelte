<script>
  function download (url, name) {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    link.remove()
  }
</script>

<h1>Propagační materiály</h1>
<h2>Texty</h2>
<p>"Andor2.cz je online platforma pro hraní stolních RPG formou textových příspěvků. Staví na komunitě CZ/SK hráčů, nabízí diskuzní fóra a další uživatelskou tvorbu. Nově přidává sólo hry s AI vypravěčem."</p>
<h2>Logo</h2>
<h3>Vektor</h3>
<div class='grid'>
  <div class='card' onclick={() => { download('/media/logo/vector/andor2.eps', 'andor2.eps') }}>
    <img src='/media/logo/raster/andor2_black.png' alt='Andor 2 logo náhled' />
    <p class='label'>EPS</p>
  </div>
  <div class='card' onclick={() => { download('/media/logo/vector/andor2.psd', 'andor2.psd') }}>
    <img src='/media/logo/raster/andor2_black.png' alt='Andor 2 logo náhled' />
    <p class='label'>PSD</p>
  </div>
  <div class='card' onclick={() => { download('/media/logo/vector/andor2.svg', 'andor2.svg') }}>
    <img src='/media/logo/raster/andor2_black.png' alt='Andor 2 logo náhled' />
    <p class='label'>SVG</p>
  </div>
</div>
<h3>Raster</h3>
<div class='grid'>
  <div class='card' onclick={() => { download('/media/logo/raster/andor2_white.png', 'andor2_white.png') }}>
    <img src='/media/logo/raster/andor2_white.png' alt='Andor 2 logo bílá verze' />
    <p class='label'>Bílé</p>
  </div>
  <div class='card' onclick={() => { download('/media/logo/raster/andor2_black.png', 'andor2_black.png') }}>
    <img src='/media/logo/raster/andor2_black.png' alt='Andor 2 logo černá verze' />
    <p class='label'>Černé</p>
  </div>
  <div class='card' onclick={() => { download('/media/logo/raster/andor2_1024x1024.png', 'andor2_1024x1024.png') }}>
    <img src='/media/logo/raster/andor2_1024x1024.png' alt='Andor 2 logo 1024x1024' />
    <p class='label'>Mramor 1024px</p>
  </div>
</div>
<h2>Obrázky</h2>
<div class='card'>
  <img src='/media/images/header_spring.jpg' alt='Andor 2 obrázek jaro' />
  <p class='label'>Hlavička jaro</p>
</div>
<div class='card'>
  <img src='/media/images/header_winter.jpg' alt='Andor 2 obrázek zima' />
  <p class='label'>Hlavička zima</p>
</div>
<div class='card'>
  <img src='/media/images/spring.jpg' alt='Andor 2 upscale jaro' />
  <p class='label'>Upscale jaro</p>
</div>
<div class='card'>
  <img src='/media/images/winter.jpg' alt='Andor 2 upscale zima' />
  <p class='label'>Upscale zima</p>
</div>
<h2>QR kód</h2>
<h2>Balíček</h2>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }
    .card {
      background: var(--blockLight);
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      transition: transform 0.2s;
      margin-bottom: 10px;
    }
      .card:hover {
        transform: scale(1.02);
      }
      .grid .card:hover {
        transform: scale(1.05);
      }
      .label {
        margin-bottom: 0px;
        padding: 0px;
      }
      img {
        display: block;
        flex: 1;
        object-fit: contain;
      }
</style>
