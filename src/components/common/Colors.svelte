<script>
  import { getHex } from '@lib/utils'

  const { user = {} } = $props()
</script>

<datalist id='presetColors'>
  {#each user.colors as color}
    <option>{getHex(color)}</option>
  {/each}

  <!-- Gray -->
  <option>#000000</option><!-- black -->
  <option>#444444</option><!-- dark gray -->
  <option>#808080</option><!-- gray -->
  <option>#c0c0c0</option><!-- silver -->
  <option>#ffffff</option><!-- white -->

  <!-- Reds to Pinks -->
  <option>#ff0000</option> <!-- red -->
  <option>#ff3333</option> <!-- light red -->
  <option>#ff6666</option> <!-- light red 2 -->
  <option>#ff9999</option> <!-- light red 3 -->
  <option>#ffcccc</option> <!-- light red 4 -->

  <!-- Purples -->
  <option>#800080</option> <!-- purple -->
  <option>#993399</option> <!-- purple 2 -->
  <option>#ff00ff</option> <!-- magenta -->
  <option>#ff33ff</option> <!-- light magenta -->
  <option>#ff66ff</option> <!-- light magenta 2 -->

  <!-- Blues -->
  <option>#0000ff</option> <!-- blue -->
  <option>#3333ff</option> <!-- light blue -->
  <option>#6666ff</option> <!-- light blue 2 -->
  <option>#000080</option> <!-- navy -->
  <option>#333399</option> <!-- navy 2 -->

  <!-- Greens -->
  <option>#008000</option> <!-- green -->
  <option>#339933</option> <!-- green 2 -->
  <option>#00ff00</option> <!-- lime -->
  <option>#33ff33</option> <!-- light lime -->
  <option>#66ff66</option> <!-- light lime 2 -->

  <!-- Yellows to Oranges -->
  <option>#ffff00</option> <!-- yellow -->
  <option>#ffff33</option> <!-- light yellow -->
  <option>#ffff66</option> <!-- light yellow 2 -->
  <option>#ffd700</option> <!-- gold -->
  <option>#ffcc00</option> <!-- dark gold -->

  <!-- Teals and Olives -->
  <option>#008080</option> <!-- teal -->
  <option>#339999</option> <!-- light teal -->
  <option>#66cccc</option> <!-- light teal 2 -->
  <option>#808000</option> <!-- olive -->
  <option>#999933</option> <!-- olive 2 -->

  <!-- Reds and Maroons -->
  <option>#800000</option> <!-- maroon -->
  <option>#993333</option> <!-- maroon 2 -->
  <option>#cc0000</option> <!-- dark red -->
  <option>#cc3333</option> <!-- dark red 2 -->
  <option>#cc6666</option> <!-- dark red 3 -->

  <!-- Blue shades -->
  <option>#325aa8</option>
  <option>#496db6</option>
  <option>#617fc4</option>
  <option>#7a92d2</option>
  <option>#93a4e0</option>

  <!-- Cyan shades -->
  <option>#32a8a1</option>
  <option>#49b6b3</option>
  <option>#61c4c5</option>
  <option>#7ad2d7</option>
  <option>#93e0e9</option>

  <!-- Green shades -->
  <option>#32a832</option>
  <option>#49b649</option>
  <option>#61c461</option>
  <option>#7ad27a</option>
  <option>#93e093</option>

  <!-- Yellow shades -->
  <option>#a8a832</option>
  <option>#b6b649</option>
  <option>#c4c461</option>
  <option>#d2d27a</option>
  <option>#e0e093</option>

  <!-- Red shades -->
  <option>#a83232</option>
  <option>#b64949</option>
  <option>#c46161</option>
  <option>#d27a7a</option>
  <option>#e09393</option>

  <!-- Magenta shades -->
  <option>#a832a8</option>
  <option>#b649b6</option>
  <option>#c461c4</option>
  <option>#d27ad2</option>
  <option>#e093e0</option>
</datalist>
