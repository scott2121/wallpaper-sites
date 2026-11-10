import { createScene } from "./scene.js";

const duration = 48;
const stages = [
  { from: 0, label: "薪が燃える" },
  { from: 0.28, label: "赤い熾火が残る" },
  { from: 0.62, label: "表面が灰に覆われる" },
  { from: 0.82, label: "灰が崩れて積もる" },
  { from: 1, label: "灰が残る" }
];
const byId = (id) => document.getElementById(id);
const canvas = byId("scene");
const settings = byId("settings");
const openSettings = byId("show-settings");
const closeSettings = byId("hide-settings");
const notice = byId("notice");
const stage = byId("stage");
const timeline = byId("timeline");
const time = byId("time");
const play = byId("play");
const restart = byId("restart");
const speed = byId("speed");
const fullscreen = byId("fullscreen");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let scene;
let elapsed = 0;
let playing = false;
let frame = 0;
let previousTime = null;
let stageLabel = "";
let displayedSecond = -1;

function formatTime(seconds) {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function draw() {
  const progress = elapsed / duration;
  scene.draw(progress, elapsed, { reducedMotion: reducedMotion.matches });
  const nextLabel = stages.findLast(({ from }) => progress >= from).label;
  const second = Math.floor(elapsed);
  timeline.value = String(elapsed);
  if (second !== displayedSecond || nextLabel !== stageLabel) {
    displayedSecond = second;
    timeline.setAttribute("aria-valuetext", `${second}秒、${nextLabel}`);
    time.textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;
  }
  if (nextLabel !== stageLabel) {
    stageLabel = nextLabel;
    stage.textContent = nextLabel;
  }
}

function schedule() {
  if (!frame && playing && !document.hidden) frame = requestAnimationFrame(tick);
}

function stopFrame() {
  cancelAnimationFrame(frame);
  frame = 0;
  previousTime = null;
}

function setPlaying(value) {
  playing = value;
  play.textContent = playing ? "一時停止" : elapsed >= duration ? "もう一度" : "再生";
  if (playing) schedule();
  else stopFrame();
}

function tick(now) {
  frame = 0;
  if (!playing || document.hidden) return;
  const delta = previousTime === null ? 0 : Math.min(0.1, (now - previousTime) / 1000);
  previousTime = now;
  elapsed = Math.min(duration, elapsed + delta * Number(speed.value));
  draw();
  if (elapsed >= duration) setPlaying(false);
  else schedule();
}

function playPause() {
  if (!scene) return;
  if (elapsed >= duration) {
    elapsed = 0;
    draw();
  }
  setPlaying(!playing);
}

function setSettingsOpen(value) {
  settings.hidden = !value;
  openSettings.hidden = value;
  openSettings.setAttribute("aria-expanded", String(value));
  closeSettings.setAttribute("aria-expanded", String(value));
  (value ? closeSettings : openSettings).focus({ preventScroll: true });
}

openSettings.addEventListener("click", () => setSettingsOpen(true));
closeSettings.addEventListener("click", () => setSettingsOpen(false));
play.addEventListener("click", playPause);
restart.addEventListener("click", () => {
  elapsed = 0;
  draw();
  setPlaying(true);
});
timeline.addEventListener("input", () => {
  elapsed = Number(timeline.value);
  setPlaying(false);
  draw();
});

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const requestFullscreen = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
fullscreen.disabled = !requestFullscreen || !exitFullscreen;
if (fullscreen.disabled) fullscreen.title = "このブラウザでは全画面に切り替えられません。";

async function toggleFullscreen() {
  if (fullscreen.disabled) return;
  try {
    if (fullscreenElement()) await exitFullscreen.call(document);
    else await requestFullscreen.call(document.documentElement);
  } catch {
    notice.hidden = false;
    notice.textContent = "全画面に切り替えられませんでした。";
    setTimeout(() => { notice.hidden = true; }, 2400);
  }
}

fullscreen.addEventListener("click", toggleFullscreen);
function updateFullscreenButton() {
  fullscreen.textContent = fullscreenElement() ? "全画面を終了" : "全画面";
}
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.key === "Escape" && !fullscreenElement()) {
    event.preventDefault();
    setSettingsOpen(settings.hidden);
    return;
  }
  if (event.target instanceof Element && event.target.closest("input, select, textarea, [contenteditable]")) return;
  if (event.key.toLowerCase() === "h") setSettingsOpen(settings.hidden);
  if (event.key.toLowerCase() === "f") toggleFullscreen();
  if (event.key === " " && (event.target === document.body || event.target === canvas)) {
    event.preventDefault();
    playPause();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopFrame();
  else schedule();
});
reducedMotion.addEventListener("change", (event) => {
  if (!scene) return;
  if (event.matches) setPlaying(false);
  draw();
});

async function start() {
  try {
    scene = await createScene(canvas);
    scene.resize();
    draw();
    notice.hidden = true;
    for (const control of [timeline, play, restart, speed]) control.disabled = false;
    new ResizeObserver(() => {
      scene.resize();
      draw();
    }).observe(canvas);
    setPlaying(!reducedMotion.matches);
  } catch (error) {
    scene = undefined;
    stopFrame();
    stage.textContent = "読み込みエラー";
    notice.textContent = "寄り画を読み込めませんでした。再読み込みしてください。";
    console.error("Campfire close-up could not be loaded", error);
  }
}

start();
