/**
 * @file moving-gradient.js
 * @description Renderer WebGL2 ultra-ottimizzato per il gradiente dinamico dello studio EvigDog.
 * Riproduce fedelmente l'effetto satinato e liquido a onde dorate/bronzo/champagne registrato
 * da Figma (Assets Esportati/dynamic_gradient_recording.mp4 & Moving-gradient-source).
 *
 * Ottimizzazioni architetturali ad altissime prestazioni:
 * - Fullscreen Quad (4 vertici) con calcolo procedurale dei domini fluidi FBM 3D in fragment shader.
 * - Zero forced reflow: dimensioni sincronizzate solo via ResizeObserver/debounced resize (mai nel render loop).
 * - Sospensione intelligente tramite IntersectionObserver: rendering a 60fps solo quando visibile (0% CPU/GPU a riposo).
 * - Capping DPR a 1.5x per massima efficienza energetica e fluidità su schermi retina 4K e dispositivi mobili.
 * - Fallback graceful degradation su CSS linear-gradient quando WebGL2 non è supportato.
 */

(function () {
  'use strict';

  /** Palette dorata/bronzo/champagne estratta da dynamic_gradient_recording.mp4 */
  const GOLD_PALETTE = [
    [0.349, 0.231, 0.129, 1.0], // #593B21 bronzo caldo profondo
    [0.482, 0.349, 0.231, 1.0], // #7B593B taupe dorato
    [0.678, 0.553, 0.380, 1.0], // #AD8D61 ambra dorata luminosa
    [0.851, 0.741, 0.580, 1.0], // #D9BDB4 seta champagne
    [0.518, 0.380, 0.239, 1.0]  // #84613D bronzo dorato ricco
  ];

  const VS_SOURCE = `#version 300 es
  in vec2 aPos;
  out vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;

  const FS_SOURCE = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform float uTime;
  uniform vec2 uResolution;

  // Rumore Perlin 3D a gradienti conforme a main.ts di Figma
  vec3 hash33(vec3 p) {
    vec3 q = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(q) * 43758.5453) * 2.0 - 1.0;
  }

  vec3 smootherCurve(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float gradDot(vec3 cell, vec3 offset, vec3 local) {
    return dot(hash33(cell + offset), local - offset);
  }

  float perlin3(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    vec3 w = smootherCurve(local);

    float n000 = gradDot(cell, vec3(0.0, 0.0, 0.0), local);
    float n100 = gradDot(cell, vec3(1.0, 0.0, 0.0), local);
    float n010 = gradDot(cell, vec3(0.0, 1.0, 0.0), local);
    float n110 = gradDot(cell, vec3(1.0, 1.0, 0.0), local);
    float n001 = gradDot(cell, vec3(0.0, 0.0, 1.0), local);
    float n101 = gradDot(cell, vec3(1.0, 0.0, 1.0), local);
    float n011 = gradDot(cell, vec3(0.0, 1.0, 1.0), local);
    float n111 = gradDot(cell, vec3(1.0, 1.0, 1.0), local);

    float nx00 = mix(n000, n100, w.x);
    float nx10 = mix(n010, n110, w.x);
    float nx01 = mix(n001, n101, w.x);
    float nx11 = mix(n011, n111, w.x);
    float nxy0 = mix(nx00, nx10, w.y);
    float nxy1 = mix(nx01, nx11, w.y);

    return mix(nxy0, nxy1, w.z) * 1.1547;
  }

  vec3 rotateOctave(vec3 p) {
    return vec3(
       0.00 * p.x + 0.80 * p.y + 0.60 * p.z,
      -0.80 * p.x + 0.36 * p.y - 0.48 * p.z,
      -0.60 * p.x - 0.48 * p.y + 0.64 * p.z
    );
  }

  float fbm(vec3 p) {
    vec3 q = p;
    float total = 0.0;
    float amplitude = 1.0;
    float weight = 0.0;
    for (int i = 0; i < 3; i++) {
      total += perlin3(q) * amplitude;
      weight += amplitude;
      q = rotateOctave(q) * 2.02 + vec3(3.7, 1.9, 6.3);
      amplitude *= 0.48;
    }
    return total / max(weight, 0.0001);
  }

  // Palette estratta direttamente da dynamic_gradient_recording.mp4
  vec3 getPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.35, 0.23, 0.13); // #593B21 deep bronze
    vec3 c1 = vec3(0.48, 0.35, 0.23); // #7B593B warm taupe
    vec3 c2 = vec3(0.68, 0.55, 0.38); // #AD8D61 luminous gold
    vec3 c3 = vec3(0.85, 0.74, 0.58); // #D9BDB4 champagne silk
    vec3 c4 = vec3(0.52, 0.38, 0.24); // #84613D golden bronze

    if (t < 0.25) return mix(c0, c1, t / 0.25);
    if (t < 0.55) return mix(c1, c2, (t - 0.25) / 0.30);
    if (t < 0.80) return mix(c2, c3, (t - 0.55) / 0.25);
    return mix(c3, c4, (t - 0.80) / 0.20);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);

    // Gradiente diagonale di base per dare profondità
    vec2 axis = normalize(vec2(0.62 * aspect, 0.78));
    float baseGrad = dot(p, axis) * 0.32 + 0.5;

    // Moto fluido 3D dei domini con deriva controllata nel tempo
    float t = uTime * 0.20;
    vec3 domainPos = vec3(p * 1.30, t * 0.30);

    // Domain warp ("Flow")
    vec3 warp = vec3(
      perlin3(domainPos + vec3(0.0, 0.0, t * 0.08)),
      perlin3(domainPos + vec3(5.2, 1.3, t * 0.12)),
      perlin3(domainPos + vec3(1.7, 9.2, t * 0.06))
    );

    vec3 warpedPos = domainPos + warp * 0.42;
    float noiseVal = fbm(warpedPos);

    // Ondulazione liquida orizzontale soffice come in Figma
    float wave = sin(p.x * 2.1 + p.y * 1.7 + noiseVal * 3.2 + t * 1.1) * 0.16;

    float param = clamp(baseGrad * 0.46 + (noiseVal * 0.5 + 0.5) * 0.44 + wave + 0.06, 0.0, 1.0);
    vec3 col = getPalette(param);

    // Bagliore satinato dorato (Satin Sheen)
    float sheen = pow(max(0.0, sin(p.x * 1.4 - p.y * 1.9 + noiseVal * 2.0 + t * 0.75)), 4.0) * 0.11;
    col += vec3(0.92, 0.84, 0.72) * sheen;

    fragColor = vec4(col, 1.0);
  }`;

  function compileShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('MovingGradient shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function linkProgram(gl, vsSrc, fsSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('MovingGradient link error:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  /**
   * Inizializza il canvas WebGL2 con gestione intelligente delle risorse e delle prestazioni.
   * @param {HTMLCanvasElement} canvas Elemento target
   */
  function initMovingGradientCanvas(canvas) {
    if (!canvas || canvas.dataset.gradientInitialized === 'true') return;
    canvas.dataset.gradientInitialized = 'true';

    // Rileva supporto WebGL2
    let gl = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'high-performance'
      });
    } catch (_e) {
      gl = null;
    }

    if (!gl) {
      // Fallback CSS fluido ed elegante in caso di mancato supporto hardware
      canvas.style.background = 'linear-gradient(135deg, #593B21 0%, #7B593B 28%, #AD8D61 58%, #D9BDB4 82%, #84613D 100%)';
      return;
    }

    const prog = linkProgram(gl, VS_SOURCE, FS_SOURCE);
    if (!prog) {
      canvas.style.background = 'linear-gradient(135deg, #593B21 0%, #7B593B 28%, #AD8D61 58%, #D9BDB4 82%, #84613D 100%)';
      return;
    }

    gl.useProgram(prog);

    // Fullscreen Quad a 4 vertici (2 triangoli in strip) - ZERO overhead geometrico
    const quadVertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0
    ]);
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    const aPosLoc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(prog, 'uTime');
    const uResLoc = gl.getUniformLocation(prog, 'uResolution');

    const startTime = performance.now();

    function drawFrame(tSec) {
      gl.useProgram(prog);
      gl.uniform1f(uTimeLoc, tSec);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Dimensionamento sincronizzato ESCLUSIVAMENTE su resize (mai dentro requestAnimationFrame)
    function updateDimensions() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor((canvas.clientWidth || canvas.parentElement?.clientWidth || 1280) * dpr));
      const h = Math.max(1, Math.floor((canvas.clientHeight || canvas.parentElement?.clientHeight || 420) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.useProgram(prog);
        gl.uniform2f(uResLoc, w, h);
        drawFrame((performance.now() - startTime) / 1000.0);
      }
    }

    updateDimensions();
    // Renderizza subito il primo frame per evitare qualsiasi frame nero
    drawFrame(0.5);

    // ResizeObserver per aggiornare le dimensioni solo quando il layout cambia effettivamente
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        updateDimensions();
      });
      ro.observe(canvas.parentElement || canvas);
    } else {
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateDimensions, 100);
      }, { passive: true });
    }

    let isVisible = true;
    let animId = null;

    function renderLoop() {
      if (!isVisible) {
        animId = null;
        return;
      }
      const SPEED_MULTIPLIER = 2.5;
      const elapsedSec = ((performance.now() - startTime) / 1000.0) * SPEED_MULTIPLIER;
      drawFrame(elapsedSec);
      animId = requestAnimationFrame(renderLoop);
    }

    // Avvia subito il loop
    animId = requestAnimationFrame(renderLoop);

    // Sospensione intelligente tramite IntersectionObserver: 0% CPU/GPU quando il banner non è a schermo
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            isVisible = true;
            if (!animId) {
              animId = requestAnimationFrame(renderLoop);
            }
          } else {
            // Se esce dallo schermo, sospendi il loop continuo ma preserva l'ultimo frame disegnato
            isVisible = false;
            if (animId) {
              cancelAnimationFrame(animId);
              animId = null;
            }
          }
        }
      }, { rootMargin: '200px 0px 200px 0px' });

      io.observe(canvas);
    }
  }

  /**
   * Cerca tutti i canvas `.moving-gradient-canvas` nel DOM e li attiva.
   */
  function mountAllMovingGradients() {
    if (typeof document === 'undefined') return;
    const canvases = document.querySelectorAll('.moving-gradient-canvas');
    canvases.forEach(initMovingGradientCanvas);
  }

  const EvigMovingGradient = {
    initMovingGradientCanvas,
    mountAllMovingGradients,
    GOLD_PALETTE
  };

  if (typeof window !== 'undefined') {
    window.EvigMovingGradient = EvigMovingGradient;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountAllMovingGradients);
    } else {
      mountAllMovingGradients();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EvigMovingGradient;
  }
})();
