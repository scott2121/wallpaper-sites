const LOG = { left: .10, right: .90, top: .49, bottom: .79, floor: .875 };
const ASH = { left: .17, right: .82, top: .58, bottom: .795 };
const TAU = 2 * Math.PI;

const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const mix = (a, b, weight) => a + (b - a) * weight;
function ease(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function prepareDebris() {
  const rand = random(768143);
  return Array.from({ length: 91 }, (_, index) => {
    const along = rand();
    const x = mix(ASH.left, ASH.right, along);
    return {
      x,
      y: mix(ASH.top, ASH.bottom, rand()),
      endX: x + (rand() - .5) * .125,
      endY: LOG.floor + (rand() - .5) * .09,
      start: .796 + .107 * (along * .48 + rand() * .52),
      duration: .014 + rand() * .022,
      size: (index < 9 ? .009 : .0014) + .006 * rand() ** 2,
      sprite: index % 12,
      angle: rand() * TAU,
      spin: (rand() - .5) * 8,
      depth: .45 + rand() * .48,
    };
  }).sort((a, b) => a.endY - b.endY);
}

function prepareSparks() {
  const rand = random(937341);
  return Array.from({ length: 24 }, () => ({
    x: mix(LOG.left + .025, LOG.right - .035, rand()),
    drift: (rand() - .5) * .16,
    rise: .07 + rand() * .24,
    delay: rand(),
    length: .001 + rand() * .004,
    period: .85 + rand() * 2.6,
  }));
}

function createEffects(aspect, flameAtlas) {
  const layer = document.createElement('canvas');
  layer.height = 340;
  layer.width = Math.round(layer.height * aspect);
  const gl = layer.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return null;

  const vertex = `#version 300 es
    void main() {
      vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
      gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
    }`;
  const fragment = `#version 300 es
    precision highp float;
    uniform vec2 resolution;
    uniform vec3 burn;
    uniform float seconds;
    uniform vec4 logBounds;
    uniform sampler2D flameAtlas;
    uniform bool hasFlameAtlas;
    out vec4 result;

    float hash(vec2 p) {
      vec3 a = fract(p.xyx * .1031);
      a += dot(a, a.yzx + 33.33);
      return fract((a.x + a.y) * a.z);
    }

    float noise(vec2 p) {
      vec2 cell = floor(p);
      vec2 f = fract(p);
      vec2 w = f * f * (3. - 2. * f);
      return mix(mix(hash(cell), hash(cell + vec2(1., 0.)), w.x),
        mix(hash(cell + vec2(0., 1.)), hash(cell + 1.), w.x), w.y);
    }

    float fBm(vec2 p) {
      return noise(p) * .57 + noise(p * 2.13 + 9.1) * .28
        + noise(p * 4.29 + 23.8) * .15;
    }

    vec2 tongue(vec2 p, float x, float origin, float salt, float width, float height) {
      float y = (origin - p.y) / height;
      float gate = smoothstep(-.06, .13, y) * (1. - smoothstep(.63, 1.13, y));
      if (gate <= 0.) return vec2(0.);
      float lift = max(y, 0.);
      float flow = fBm(vec2(lift * 4.6 - seconds * 2.2, salt));
      float bend = (flow - .46) * (.028 + .131 * lift)
        + sin(lift * 7.7 - seconds * 2.3 + salt) * lift * .022;
      float thin = width * (1. - clamp(lift, 0., .98) * .88);
      float distance = (p.x - x - bend) / thin;
      float veil = fBm(vec2(distance * 1.43 + salt, lift * 8.5 - seconds * 3.65));
      float texture = smoothstep(.27, .67, veil + .24 * (1. - lift));
      float edge = (1. - smoothstep(.63, .97, abs(distance))) * smoothstep(.16, .59, abs(distance));
      float core = exp(-distance * distance * 11.8)
        * smoothstep(.12, .31, y) * (1. - smoothstep(.53, .89, y));
      return vec2(gate * texture * (edge * .68 + exp(-distance * distance * 3.8) * .44),
        gate * texture * core);
    }

    vec4 flameFrame(float frame, vec2 uv) {
      vec2 tile = vec2(mod(frame, 2.), floor(frame * .5));
      return texture(flameAtlas, (tile + uv * .996 + .002) * .5);
    }

    vec4 photographedFlame(vec2 uv) {
      float base = .625;
      float height = mix(.23, .50, burn.x) * (.94 + .09 * sin(seconds * 2.8) + .06 * sin(seconds * 5.3));
      vec2 position = vec2((uv.x - .095) / .81, (uv.y - base + height) / height);
      if (position.x < -.08 || position.x > 1.08 || position.y < -.06 || position.y > 1.) return vec4(0.);
      float rise = clamp(1. - position.y, 0., 1.);
      vec2 flow = vec2(position.x * 4.2, position.y * 5.6 - seconds * 2.05);
      position.x += (fBm(flow) - .5) * (.025 + .20 * rise);
      position.y += (noise(flow * 1.47 + 17.) - .5) * .071 * rise;
      float edge = smoothstep(.015, .095, position.x) * (1. - smoothstep(.905, .985, position.x));
      float root = 1. - smoothstep(.835 + .035 * noise(vec2(position.x * 11., seconds * 1.2)), .927, position.y);
      float tip = smoothstep(0., .08, position.y);
      float frame = seconds * 3.1 + noise(vec2(seconds * .67, 3.)) * .65;
      vec4 photo = mix(flameFrame(mod(floor(frame), 4.), clamp(position, 0., 1.)),
        flameFrame(mod(floor(frame) + 1., 4.), clamp(position, 0., 1.)), smoothstep(.05, .94, fract(frame)));
      return photo * edge * root * tip * burn.x * .91;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      uv.y = 1. - uv.y;
      float center = (logBounds.x + logBounds.y) * .5;
      float halfWidth = (logBounds.y - logBounds.x) * .5;
      vec2 flame = vec2(0.);
      if (!hasFlameAtlas && burn.x > .004 && uv.y < logBounds.w + .015 && uv.y > logBounds.z - .43
          && abs(uv.x - center) < halfWidth + .17) {
        float h = mix(.67, 1.13, burn.x);
        float surge = noise(vec2(seconds * 1.21, 11.));
        float flare = noise(vec2(seconds * 2.18, 27.));
        flame += tongue(uv, .34, .641, 5.6, .092, (.33 + .12 * surge) * h) * 1.35;
        flame += tongue(uv, .403, .607, 7.3, .071, (.23 + .15 * flare) * h) * (.42 + .72 * surge);
        flame += tongue(uv, .282, .683, 2.1, .055, .23 * h) * smoothstep(.13, .63, flare);
        flame += tongue(uv, .628, .674, 9.7, .076, (.19 + .13 * flare) * h) * (.52 + .57 * flare);
        flame += tongue(uv, .669, .651, 13.6, .038, .24 * h) * smoothstep(.32, .74, surge) * .65;
        flame *= 1. - smoothstep(logBounds.z + .10, logBounds.w, uv.y) * .81;
      }

      float emberY = (logBounds.z + logBounds.w) * .5;
      vec2 d = vec2((uv.x - center) / (halfWidth * 1.05), (uv.y - emberY) / .095);
      float hot = exp(-d.x * d.x * d.x * d.x - d.y * d.y);
      hot *= burn.y * (.32 + .68 * noise(uv * vec2(18., 8.) + seconds * .65));

      float flameAlpha = burn.x * (1. - exp(-(flame.x + flame.y) * 1.64)) * .88;
      vec3 flameColor = mix(vec3(.96, .177, .017), vec3(1., .56, .055), smoothstep(.06, .48, flame.x + flame.y));
      flameColor = mix(flameColor, vec3(1., .87, .55), smoothstep(.23, .86, flame.y));
      float emberAlpha = hot * .082;
      vec3 emberColor = vec3(.99, .23, .035);

      float height = logBounds.z - uv.y;
      float smokeAlpha = 0.;
      if (burn.z > .01 && height > -.008 && abs(uv.x - center) < .54) {
        vec2 curl = vec2(uv.x * 5.9 + height * 1.5, height * 5.4 - seconds * .38);
        float rolling = fBm(curl + vec2(fBm(curl * 1.64 + 3.2), 0.));
        float axis = center + .07 * sin(height * 5.2 - seconds * .30) + height * .17;
        float offset = (uv.x - axis) / (.09 + height * .35);
        float plume = exp(-offset * offset);
        smokeAlpha = burn.z * plume * smoothstep(.29, .75, rolling)
          * smoothstep(0., .09, height) * (1. - smoothstep(.26, .56, height)) * .31;
      }

      vec3 smokeColor = mix(vec3(.16, .145, .132), vec3(.36, .26, .20), hot);
      float alpha = flameAlpha + emberAlpha * (1. - flameAlpha);
      vec3 rgb = flameColor * flameAlpha + emberColor * emberAlpha * (1. - flameAlpha);
      if (hasFlameAtlas && burn.x > .004) {
        vec4 fire = photographedFlame(uv);
        rgb = fire.rgb + rgb * (1. - fire.a);
        alpha = fire.a + alpha * (1. - fire.a);
      }
      result = vec4(rgb * (1. - smokeAlpha) + smokeColor * smokeAlpha,
        alpha * (1. - smokeAlpha) + smokeAlpha);
    }`;

  function compile(kind, source) {
    const shader = gl.createShader(kind);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const reason = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(reason);
    }
    return shader;
  }

  try {
    const program = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));

    gl.useProgram(program);
    gl.viewport(0, 0, layer.width, layer.height);
    const burn = gl.getUniformLocation(program, 'burn');
    const seconds = gl.getUniformLocation(program, 'seconds');
    gl.uniform2f(gl.getUniformLocation(program, 'resolution'), layer.width, layer.height);
    gl.uniform4f(gl.getUniformLocation(program, 'logBounds'), LOG.left, LOG.right, LOG.top, LOG.bottom);
    const flameTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, flameTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    if (flameAtlas) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flameAtlas);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    }
    gl.uniform1i(gl.getUniformLocation(program, 'flameAtlas'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'hasFlameAtlas'), flameAtlas ? 1 : 0);

    return {
      layer,
      draw(time, flame, heat, smoke) {
        if (gl.isContextLost()) return false;
        gl.uniform3f(burn, flame, heat, smoke);
        gl.uniform1f(seconds, time);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return true;
      },
    };
  } catch {
    return null;
  }
}

function softLight(ctx, x, y, rx, ry, inner, outer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(.42, outer);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawFallbackEffects(ctx, time, flame, heat, smoke) {
  const x = (LOG.left + LOG.right) / 2;
  if (smoke > .015) {
    for (let i = 0; i < 5; i++) {
      const phase = (i / 5 + time * .11) % 1;
      softLight(ctx, x + Math.sin(time * .74 + i) * phase * .10, LOG.top - phase * .47,
        .04 + phase * .14, .03 + phase * .12,
        `rgba(112,97,85,${Math.sin(phase * Math.PI) * smoke * .115})`,
        `rgba(71,63,57,${smoke * .038})`);
    }
  }
  if (flame > .015) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) {
      const flicker = .7 + .3 * Math.sin(time * 7.3 + i * 1.9);
      const y = LOG.bottom - .07 - flicker * .045;
      softLight(ctx, mix(LOG.left + .04, LOG.right - .04, i / 6) + Math.sin(time * 3.9 + i) * .019,
        y, .039, .11 + flicker * .10, `rgba(249,161,72,${flame * flicker * .29})`,
        `rgba(230,67,13,${flame * .12})`);
    }
    ctx.restore();
  }
  if (heat > .015) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    softLight(ctx, x, (LOG.top + LOG.bottom) / 2, (LOG.right - LOG.left) / 2, .079,
      `rgba(255,75,16,${heat * .21})`, `rgba(193,41,9,${heat * .085})`);
    ctx.restore();
  }
}

function prepareFlameTiles(image) {
  const width = Math.floor(image.naturalWidth / 2);
  const height = Math.floor(image.naturalHeight / 2);
  return Array.from({ length: 4 }, (_, index) => {
    const tile = document.createElement('canvas');
    tile.width = width;
    tile.height = height;
    const brush = tile.getContext('2d');
    brush.drawImage(image, index % 2 * width + 1, Math.floor(index / 2) * height + 1,
      width - 2, height - 2, 0, 0, width, height);
    brush.globalCompositeOperation = 'destination-in';
    const fade = brush.createLinearGradient(0, 0, 0, height);
    fade.addColorStop(0, 'transparent');
    fade.addColorStop(.085, '#fff');
    fade.addColorStop(.84, '#fff');
    fade.addColorStop(.927, 'transparent');
    brush.fillStyle = fade;
    brush.fillRect(0, 0, width, height);
    return tile;
  });
}

function drawFlameTiles(ctx, tiles, time, flame) {
  const phase = time * 3.1;
  const frame = Math.floor(phase);
  const weight = ease(.05, .94, phase - frame);
  const height = mix(.23, .50, flame) * (.94 + .09 * Math.sin(time * 2.8) + .06 * Math.sin(time * 5.3));
  const x = .095 + Math.sin(time * 2.1) * .008;
  ctx.save();
  ctx.globalAlpha = flame * .91 * (1 - weight);
  ctx.drawImage(tiles[frame % 4], x, .625 - height, .81, height);
  ctx.globalAlpha = flame * .91 * weight;
  ctx.drawImage(tiles[(frame + 1) % 4], x, .625 - height, .81, height);
  ctx.restore();
}

function drawSparks(ctx, sparks, time, flame) {
  if (flame < .02) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (const spark of sparks) {
    const age = (time / spark.period + spark.delay) % 1;
    const strength = ease(.00, .11, age) * (1 - ease(.22, .94, age)) * flame;
    if (strength < .025) continue;
    const x = spark.x + spark.drift * age ** 1.4;
    const y = LOG.top - spark.rise * age;
    ctx.strokeStyle = `rgba(255,163,62,${strength * .72})`;
    ctx.lineWidth = .0012 + strength * .0007;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - spark.drift * .015, y + spark.length * (1 - age * .6));
    ctx.stroke();
  }
  ctx.restore();
}

function prepareFlakeSprites(image, frameWidth, frameHeight) {
  const rand = random(181491);
  return Array.from({ length: 12 }, () => {
    const tile = document.createElement('canvas');
    tile.width = 44;
    tile.height = 44;
    const brush = tile.getContext('2d');
    const points = 6 + Math.floor(rand() * 4);
    const offset = rand();
    brush.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points + offset) * TAU;
      const radius = 11 + rand() * 10;
      brush.lineTo(22 + Math.cos(angle) * radius, 22 + Math.sin(angle) * radius * .72);
    }
    brush.closePath();
    brush.clip();
    const sampleX = (.24 + rand() * .48) * frameWidth;
    const sampleY = (1.59 + rand() * .13) * frameHeight;
    brush.drawImage(image, sampleX, sampleY, 22, 18, 0, 0, 44, 44);
    const bevel = brush.createLinearGradient(0, 11, 0, 34);
    bevel.addColorStop(0, '#d9cbb126');
    bevel.addColorStop(.45, 'transparent');
    bevel.addColorStop(1, '#09070699');
    brush.fillStyle = bevel;
    brush.fillRect(0, 0, 44, 44);
    return tile;
  });
}

function drawFlake(ctx, sprite, flake, x, y, angle, scale, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity * flake.depth;
  ctx.drawImage(sprite, -1, -1, 2, 2);
  ctx.restore();
}

function drawDebris(ctx, debris, sprites, progress, reducedMotion) {
  for (const flake of debris) {
    const age = (progress - flake.start) / flake.duration;
    if (age < 0 || (reducedMotion && age < 1)) continue;
    const p = clamp(age);
    const settle = 1 - Math.exp(-9 * Math.max(0, age - 1));
    const bounce = age > 1 ? Math.sin((age - 1) * 18) * Math.exp(-(age - 1) * 8) * .004 : 0;
    const x = mix(flake.x, flake.endX, p) + Math.sin(p * Math.PI) * flake.spin * .003;
    const y = mix(flake.y, flake.endY, p * p) - Math.max(0, bounce);
    const opacity = ease(0, .14, age) * (1 - settle * .21);
    drawFlake(ctx, sprites[flake.sprite], flake, x, y, flake.angle + flake.spin * p,
      flake.size * (1 - settle * .27), opacity);
  }
}

function buildEmberMap(image, width, height, frame) {
  const texture = document.createElement('canvas');
  texture.width = width;
  texture.height = height;
  const brush = texture.getContext('2d', { willReadFrequently: true });
  brush.drawImage(image, frame % 2 * width, Math.floor(frame / 2) * height, width, height, 0, 0, width, height);
  const pixels = brush.getImageData(0, 0, width, height);
  const data = pixels.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const red = data[i];
      const excessRed = red - 1.45 * data[i + 1] - .18 * data[i + 2];
      const insideLog = y > height * .45 && y < height * .85;
      data[i] = 255;
      data[i + 1] = 44 + red * .39;
      data[i + 2] = 14 + red * .10;
      data[i + 3] = insideLog ? 255 * ease(24, 101, excessRed) : 0;
    }
  }
  brush.putImageData(pixels, 0, 0);
  return texture;
}

function drawEmberMap(ctx, texture, time, strength) {
  if (strength < .012) return;
  const width = texture.width;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const left = i / 4;
    ctx.globalAlpha = strength * (.26 + .22 * Math.sin(time * (1.5 + i * .17) + i * 2.1));
    ctx.drawImage(texture, left * width, 0, width / 4, texture.height, left, 0, .25, 1);
  }
  ctx.restore();
}

function createCollapseLayer(image, width, height) {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const brush = layer.getContext('2d');
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const edge = mask.getContext('2d');
  const fractures = [.02, -.04, .06, .12, -.04, .03, -.10, .09, .05, -.05, .04, 0];

  return {
    layer,
    draw(amount) {
      edge.clearRect(0, 0, width, height);
      edge.filter = 'blur(3px)';
      edge.fillStyle = 'white';
      edge.beginPath();
      edge.moveTo(-15, -15);
      const base = mix(.44, .96, amount);
      const shift = Math.sin(amount * Math.PI);
      for (let i = 0; i < fractures.length; i++) {
        const x = (width + 30) * i / (fractures.length - 1) - 15;
        edge.lineTo(x, height * (base + fractures[i] * shift));
      }
      edge.lineTo(width + 15, -15);
      edge.closePath();
      edge.fill();
      brush.clearRect(0, 0, width, height);
      brush.drawImage(image, width + 1, height + 1, width - 2, height - 2, 0, 0, width, height);
      brush.globalCompositeOperation = 'destination-in';
      brush.drawImage(mask, 0, 0);
      brush.globalCompositeOperation = 'source-over';
    },
  };
}

function drawDust(ctx, progress, reducedMotion) {
  if (reducedMotion) return;
  for (let i = 0; i < 7; i++) {
    const age = (progress - .801 - i * .008) / .11;
    if (age <= 0 || age >= 1) continue;
    const opacity = Math.sin(age * Math.PI) * .15;
    softLight(ctx, mix(LOG.left + .04, LOG.right - .04, i / 6) + age * .05,
      LOG.floor - age * .078, .021 + age * .075, .013 + age * .032,
      `rgba(156,142,124,${opacity})`, `rgba(111,99,84,${opacity * .42})`);
  }
}

async function loadImage(filename) {
  const image = new Image();
  image.decoding = 'async';
  image.src = new URL(filename, import.meta.url).href;
  await image.decode();
  return image;
}

export async function createScene(canvas) {
  const [image, flameAtlas] = await Promise.all([
    loadImage('./burn-stages.webp'),
    loadImage('./flame-stages.webp').catch(() => null),
  ]);

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  const frameWidth = Math.floor(image.naturalWidth / 2);
  const frameHeight = Math.floor(image.naturalHeight / 2);
  if (frameWidth < 16 || frameHeight < 16) throw new Error('The burn image has no usable frames');

  const effects = createEffects(frameWidth / frameHeight, flameAtlas);
  const debris = prepareDebris();
  const flakeSprites = prepareFlakeSprites(image, frameWidth, frameHeight);
  const sparks = prepareSparks();
  const emberMaps = [buildEmberMap(image, frameWidth, frameHeight, 1),
    buildEmberMap(image, frameWidth, frameHeight, 2)];
  const collapseLayer = createCollapseLayer(image, frameWidth, frameHeight);
  let flameTiles;
  let viewport = { width: 1, height: 1, left: 0, top: 0 };

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2.5e6 / (width * height)));
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    // Keep the entire log in the tall viewport and use edge falloff to blend the bars.
    const cover = Math.max(pixelWidth / frameWidth, pixelHeight / frameHeight);
    const scale = Math.min(cover, pixelWidth / (frameWidth * .87), pixelHeight / (frameHeight * .85));
    const shotWidth = frameWidth * scale;
    const shotHeight = frameHeight * scale;
    viewport = {
      left: (pixelWidth - shotWidth) * .5,
      top: (pixelHeight - shotHeight) * .5,
      width: shotWidth,
      height: shotHeight,
    };
  }

  function paintPhoto(frame, opacity = 1) {
    if (opacity <= 0) return;
    ctx.globalAlpha = opacity;
    // Inset source rectangles avoid sampling the adjoining frame at the contact sheet seam.
    ctx.drawImage(image, (frame % 2) * frameWidth + 1, Math.floor(frame / 2) * frameHeight + 1,
      frameWidth - 2, frameHeight - 2, 0, 0, 1, 1);
    ctx.globalAlpha = 1;
  }

  function draw(progress, motionSeconds, { reducedMotion = false } = {}) {
    const p = clamp(progress);
    const time = reducedMotion ? 0 : motionSeconds;
    const flame = (1 - ease(.11, .39, p)) * (.86 + .14 * Math.sin(time * 4.6));
    const heat = (.63 + .37 * ease(.08, .36, p)) * (1 - ease(.54, .89, p));
    const smoke = (.4 + .53 * ease(.19, .59, p)) * (1 - ease(.75, .99, p));
    const burning = ease(.095, .35, p);
    const cooling = ease(.43, .72, p);
    const collapse = ease(.798, .925, p);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#090808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(viewport.width, 0, 0, viewport.height, viewport.left, viewport.top);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 1, 1);
    ctx.clip();

    // Retain the continuous camera and blend only the adjacent state.
    if (collapse >= 1) {
      paintPhoto(3);
    } else if (collapse > 0) {
      paintPhoto(2);
      // Reveal the settled pile along an uneven falling edge. The ground and camera stay fixed.
      collapseLayer.draw(collapse);
      ctx.drawImage(collapseLayer.layer, 0, 0, 1, 1);
    } else if (cooling >= 1) {
      paintPhoto(2);
    } else if (cooling > 0) {
      paintPhoto(1);
      paintPhoto(2, cooling);
    } else {
      paintPhoto(0);
      paintPhoto(1, burning);
    }
    if (burning > 0 && cooling < 1) drawEmberMap(ctx, emberMaps[0], time, burning * heat * (1 - cooling));
    if (cooling > 0 && collapse < 1) drawEmberMap(ctx, emberMaps[1], time, cooling * heat * (1 - collapse));
    if (flame > .01) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const light = flame * (.72 + .28 * Math.sin(time * 5.3 + .6));
      softLight(ctx, .39, .74, .48, .22, `rgba(238,81,16,${light * .13})`, `rgba(163,43,8,${light * .05})`);
      ctx.restore();
    }

    const visibleFlame = flame * (reducedMotion ? .58 : 1);
    if (effects?.draw(time, visibleFlame, heat, smoke)) {
      ctx.drawImage(effects.layer, 0, 0, 1, 1);
    } else {
      drawFallbackEffects(ctx, time, flameAtlas ? 0 : visibleFlame, heat, smoke);
      if (flameAtlas && visibleFlame > .01) {
        flameTiles ??= prepareFlameTiles(flameAtlas);
        drawFlameTiles(ctx, flameTiles, time, visibleFlame);
      }
    }

    if (!reducedMotion) drawSparks(ctx, sparks, time, flame);
    drawDebris(ctx, debris, flakeSprites, p, reducedMotion);
    drawDust(ctx, p, reducedMotion);
    ctx.restore();
  }

  resize();
  return { draw, resize };
}
