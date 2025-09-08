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

<h2>Bannery</h2>
<div class='grid'>
  <div class='card'>
    <img src='/media/banner/banner1.jpg' alt='Andor 2 banner 1' />
    <p class='label'>Banner 1</p>
  </div>
</div>

<h2>Obrázky</h2>
<div class='card'>
  <img src='/media/art/spring.jpg' alt='Andor 2 upscale jaro' />
  <p class='label'>Upscale jaro</p>
</div>
<div class='card'>
  <img src='/media/art/winter.jpg' alt='Andor 2 upscale zima' />
  <p class='label'>Upscale zima</p>
</div>
<div class='card'>
  <img src='/media/art/art1.jpg' alt='Andor 2 art 1' />
  <p class='label'>Art 1</p>
</div>
<div class='card'>
  <img src='/media/art/art2.jpg' alt='Andor 2 art 2' />
  <p class='label'>Art 2</p>
</div>
<div class='card'>
  <img src='/media/art/art3.jpg' alt='Andor 2 art 3' />
  <p class='label'>Art 3</p>
</div>

<h2>Barvy</h2>
<div class='grid'>
  <div class='card' style='background: #FFD700; color: black'>Zlatá #FFD700</div>
  <div class='card' style='background: #c48d66; color: white'>Oranžová #c48d66</div>
  <div class='card' style='background: #634b41; color: white'>Hnědá 1 #634b41</div>
  <div class='card' style='background: #3c3936; color: white'>Hnědá 2 #3c3936</div>
  <div class='card' style='background: #a5a664; color: black'>Zelená #a5a664</div>
</div>

<h2>QR kód</h2>
<div class='grid'>
  <div class='card' onclick={() => { download('/media/qr/qr.png', 'qr.png') }}>
    <img src='/media/qr/qr.png' alt='Andor 2 QR PNG' />
    <p class='label'>Image</p>
  </div>
  <div class='card' onclick={() => { download('/media/qr/qr_black.png', 'qr_black.png') }}>
    <img src='/media/qr/qr_black.png' alt='Andor 2 QR Black' />
    <p class='label'>Black</p>
  </div>
  <div class='card' onclick={() => { download('/media/qr/qr_white.png', 'qr_white.png') }}>
    <img src='/media/qr/qr_white.png' alt='Andor 2 QR White' />
    <p class='label'>White</p>
  </div>
  <div class='card' onclick={() => { download('/media/qr/qr.svg', 'qr.svg') }}>
    <img src='/media/qr/qr_black.png' alt='Andor 2 QR SVG' />
    <p class='label'>SVG</p>
  </div>
</div>

<h2>Balíček</h2>
<p>Všechny výše uvedené materiály jsou dostupné v jednom ZIP balíčku: <a href='https://www.dropbox.com/scl/fi/a5o34bghpta69ihrsecb0/media.zip?rlkey=29ioolm76bp5hf45lp52wbiy0&dl=1' download>media.zip</a> (6.2 MB)</p>

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
