
<div id='dots'></div>

<style>
  #dots {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90px;
    height: 14px;
    z-index: 999;
    background:
      radial-gradient(circle closest-side, var(--accent) 92%,#0000 ) calc(100%/-4) 0,
      radial-gradient(circle closest-side, var(--accent) 92%,#0000 ) calc(100%/4)  0;
    background-size: calc(100%/2) 100%;
    animation: rotation 1.5s infinite;
  }
  @keyframes rotation {
    0%   {background-position: calc(100%/-4) 0    ,calc(100%/4) 0}
    50%  {background-position: calc(100%/-4) -14px,calc(100%/4) 14px}
    100% {background-position: calc(100%/4)  -14px,calc(3*100%/4) 14px}
  }
</style>
