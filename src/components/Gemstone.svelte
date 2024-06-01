<script>
  function goUp () { window.scrollTo(0, 0) }
  function goDown () { window.scrollTo(0, document.body.scrollHeight) }
</script>

<div class='gem'>
  <button class='plain up' on:click={goUp}></button>
  <button class='plain down' on:click={goDown}></button>
</div>

<style>
  .gem {
    position: fixed;
    top: 82%;
    right: 304px;
    width: 32px;
    z-index: 9;
    transform: translateY(-50%);
  }
    .gem button {
      width: 32px;
      background-image: url('/gemstone-01.png');
      background-size: 32px 149px;
      background-repeat: no-repeat;
    }
      .gem button:hover {
        transform: scale(1.1);
      }
      .up {
        background-position: center 2px;
        height: 41px;
      }
        .up:hover {
          background-position: center -70px;
        }
      .down {
        background-position: center -36px;
        height: 36px;
      }
        .down:hover {
          background-position: center -113px;
        }

  @media (max-width: 1000px) {
    .gem {
      right: 5px;
    }
  }
</style>
