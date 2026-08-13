/* ===== 首页探照灯背景（移植自 hero-program）=====
 * 仅在首页（#page-header.full_page）生效：隐藏 canvas 每帧绘制以鼠标为
 * 中心的径向渐变，toDataURL 后作为上层背景图的 CSS mask，实现探照灯效果。
 */
(function () {
  var HEADER = document.getElementById('page-header');
  if (!HEADER || !HEADER.classList.contains('full_page')) return;

  var canvas = document.getElementById('spotlight-canvas');
  var mask = document.getElementById('spotlight-mask');
  if (!canvas || !mask) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var SPOTLIGHT_R = 260; // 探照灯半径
  var rawMouse = { x: -999, y: -999 };   // 光标实际位置（初始在画面外 → BG2 不可见）
  var smoothMouse = { x: -999, y: -999 }; // 平滑后的光标位置（lerp 跟随）
  var rafId = 0;
  var lastW = 0, lastH = 0; // 检测视口尺寸变化，避免每帧重建 canvas

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 把白色径向渐变画到隐藏 canvas 上，再以 toDataURL 作为上层图片的 CSS mask */
  function draw(cx, cy) {
    var w = window.innerWidth, h = window.innerHeight;
    if (w !== lastW || h !== lastH) {
      canvas.width = w;
      canvas.height = h;
      lastW = w; lastH = h;
    }
    var gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, SPOTLIGHT_R);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.4, '#fff');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 白色区域 → mask 不透明 → 露出 BG2；透明处 → 显示底层 BG1
    var dataUrl = canvas.toDataURL();
    mask.style.maskImage = 'url(' + dataUrl + ')';
    mask.style.webkitMaskImage = 'url(' + dataUrl + ')';
  }

  function animate() {
    // 指数平滑：每帧向光标位置靠拢 10%，形成柔和尾随效果
    smoothMouse.x += (rawMouse.x - smoothMouse.x) * 0.1;
    smoothMouse.y += (rawMouse.y - smoothMouse.y) * 0.1;
    draw(smoothMouse.x, smoothMouse.y);
    rafId = requestAnimationFrame(animate);
  }

  function onMouseMove(e) {
    rawMouse.x = e.clientX;
    rawMouse.y = e.clientY;
  }

  // 初始：光标在画面外，BG2 完全隐藏
  draw(-999, -999);

  if (reduced) {
    // 减弱动画偏好：居中画一次让 BG2 静态可见，不启动 rAF 循环
    rawMouse.x = smoothMouse.x = window.innerWidth / 2;
    rawMouse.y = smoothMouse.y = window.innerHeight / 2;
    draw(window.innerWidth / 2, window.innerHeight / 2);
    return;
  }

  window.addEventListener('mousemove', onMouseMove);
  rafId = requestAnimationFrame(animate);
})();
