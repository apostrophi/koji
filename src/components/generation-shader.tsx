"use client";

import { useEffect, useRef, useCallback } from "react";

// Vertex shader — fullscreen quad
const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment shader — Dot grid reveal
//
// The image starts hidden behind a field of evenly-spaced dots.
// Each dot is a small circle sampling the image color underneath.
// Dots breathe and shift size continuously while loading.
// As progress increases, dots grow and eventually merge into the full image.
const FRAG = `
precision highp float;

uniform sampler2D u_image;
uniform float u_time;
uniform float u_progress;
uniform vec2 u_resolution;

varying vec2 v_uv;

// Simple hash for per-dot randomness
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time;

  // --- Grid parameters ---
  float dotCount = 72.0;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 cellSize = vec2(1.0 / dotCount, aspect / dotCount);
  vec2 cellId = floor(uv / cellSize);
  vec2 cellUv = fract(uv / cellSize);
  vec2 cellCenter = (cellId + 0.5) * cellSize;

  // Per-dot random seed (stable per cell)
  float rnd = hash(cellId);

  // Sample image at cell center and at exact pixel
  vec3 imageColor = texture2D(u_image, cellCenter).rgb;
  vec3 sharpColor = texture2D(u_image, uv).rgb;
  float luma = dot(imageColor, vec3(0.299, 0.587, 0.114));

  // --- Progress curves ---
  float growPhase = smoothstep(0.0, 0.7, u_progress);
  float revealPhase = smoothstep(0.65, 1.0, u_progress);

  // --- Animated dot radius ---
  // Base size grows with progress
  float baseRadius = mix(0.03, 0.58, growPhase);

  // BREATHING: each dot oscillates at its own frequency/phase
  // Stronger breathing at lower progress, fades as dots merge
  float breathAmp = mix(0.12, 0.0, growPhase);
  float breathFreq = mix(2.5, 4.0, rnd);
  float breathPhase = rnd * 6.28 + cellId.x * 0.4 + cellId.y * 0.3;
  float breath = sin(t * breathFreq + breathPhase) * breathAmp;

  // WAVE: ripple expanding outward from center over time
  float distFromCenter = length((cellId * cellSize) - 0.5);
  float wave = sin(distFromCenter * 15.0 - t * 3.5) * 0.04 * (1.0 - growPhase);

  // BRIGHTNESS-LINKED: brighter image areas get slightly larger dots
  float lumaBias = (luma - 0.5) * 0.06;

  float radius = baseRadius + breath + wave + lumaBias;
  radius = max(radius, 0.01); // never fully disappear

  // Distance from cell center
  float dist = length(cellUv - 0.5);

  // Dot mask — soft anti-aliased edge
  float edgeSoftness = 0.6 / dotCount;
  float dotMask = 1.0 - smoothstep(radius - edgeSoftness, radius + edgeSoftness, dist);

  // --- Background between dots ---
  vec3 bgColor = vec3(0.04, 0.04, 0.04);

  // --- Compose ---
  vec3 dotResult = mix(bgColor, imageColor, dotMask);
  vec3 finalColor = mix(dotResult, sharpColor, revealPhase);

  // --- Subtle per-dot shimmer while loading ---
  float shimmer = 1.0 + sin(t * 5.0 + rnd * 6.28) * 0.06 * (1.0 - revealPhase);
  finalColor *= shimmer;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

interface GenerationShaderProps {
  imageUrl: string;
  progress: number; // 0 to 1
  className?: string;
}

export function GenerationShader({
  imageUrl,
  progress,
  className = "",
}: GenerationShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const uniformsRef = useRef<{
    u_time: WebGLUniformLocation | null;
    u_progress: WebGLUniformLocation | null;
    u_resolution: WebGLUniformLocation | null;
    u_image: WebGLUniformLocation | null;
  }>({ u_time: null, u_progress: null, u_resolution: null, u_image: null });

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const initGL = useCallback((canvas: HTMLCanvasElement, image: HTMLImageElement) => {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    glRef.current = gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAG);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);
    programRef.current = program;

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    textureRef.current = tex;

    uniformsRef.current = {
      u_time: gl.getUniformLocation(program, "u_time"),
      u_progress: gl.getUniformLocation(program, "u_progress"),
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_image: gl.getUniformLocation(program, "u_image"),
    };

    gl.uniform1i(uniformsRef.current.u_image, 0);
    startTimeRef.current = Date.now();
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    gl.uniform1f(uniformsRef.current.u_time, elapsed);
    gl.uniform1f(uniformsRef.current.u_progress, progressRef.current);
    gl.uniform2f(uniformsRef.current.u_resolution, w, h);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      initGL(canvas, img);
      animFrameRef.current = requestAnimationFrame(render);
    };
    img.src = imageUrl;

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      const gl = glRef.current;
      if (gl) {
        if (programRef.current) gl.deleteProgram(programRef.current);
        if (textureRef.current) gl.deleteTexture(textureRef.current);
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      }
    };
  }, [imageUrl, initGL, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
