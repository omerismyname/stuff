import {slider, bar, time} from "./elements.mjs";
import {updateTime} from "./buttons.mjs";
import {secondsToTime} from "./timeStuff.mjs";

let events = {
  move: "pointermove",
  end: "pointerup",
  cancel: "pointercancel"
};

if (!window.PointerEvent) {
  events.move = "touchmove";
  events.end = "touchend";
  events.cancel = "touchcancel";
}

function Slider(startCallback, moveCallback, endCallback) {
  let startX = 0, currentX = 0, value = 0, percentage = 0;

  function limitValue(val, low = 0, high = slider.clientWidth) {
    let v = val;
    if (val < low) {v = low;}
    if (val > high) {v = high;}
    percentage = v / high;
    return v;
  }

  function getPointerPosX(e) {
    if (e.targetTouches) {
      return e.targetTouches[0].clientX;
    } else {
      return e.clientX
    }
  }

  function handleMove(e) {
    e.preventDefault();
    requestAnimationFrame(() => {
      currentX = getPointerPosX(e);
      value = limitValue(currentX - startX);
      bar.style.width = (value / slider.clientWidth) * 100 + "%";
      moveCallback(percentage);
    });
  }

  function handleEnd(e) {
    e.preventDefault();
    requestAnimationFrame(() => {
      value = limitValue(getPointerPosX(e) - startX);
      endCallback(percentage);
    });
    document.removeEventListener(events.move, handleMove, true);
    document.removeEventListener(events.end, handleEnd, true);
    document.removeEventListener(events.cancel, handleEnd, true);
  }

  function handleDown(e) {
    e.preventDefault();
    requestAnimationFrame(() => {
      startX = slider.parentElement.offsetLeft;
      startCallback();
    });
    document.addEventListener(events.move, handleMove, true);
    document.addEventListener(events.end, handleEnd, true);
    document.addEventListener(events.cancel, handleEnd, true);
  }

  if (window.PointerEvent) {
    slider.onpointerdown = handleDown;
  } else {
    slider.ontouchstart = handleDown;
    slider.onmousedown = handleDown;
  }
}

export function loadSlider(player, updateFunction) {
  const startCallback = () => {
    if (player.playing) {player.willResume = true;} else {player.willResume = false;}
    player.playing = false;
    player.pause();
    player.srcElement.muted = true;
  };
  
  const moveCallback = percentage => {
    let s = percentage * player.srcElement.duration;
    time.elapsed.innerHTML = secondsToTime(s);
  };
  
  const endCallback = percentage => {
    player.srcElement.currentTime = percentage * player.srcElement.duration;
    updateTime(player);
    player.srcElement.muted = false;

    if (player.willResume) {
      player.play();
      player.playing = true;
      requestAnimationFrame(updateFunction);
    }
  };

  Slider(startCallback, moveCallback, endCallback);
}