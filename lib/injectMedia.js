export function injectMedia(container, state, baseUrl) {
  const file = state.file;
  let wrapper = container.querySelector(".media-shell");

  if (wrapper && wrapper.classList.contains("media-placeholder")) {
    wrapper.remove();
    wrapper = null;
  }

  if (wrapper) return;

  wrapper = document.createElement("div");
  wrapper.className = "media-shell";

  let el;

  if (file.endsWith(".mp4") || file.endsWith(".webm") || file.endsWith(".mov")) {
    el = document.createElement("video");
    el.src = baseUrl + file;
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.controls = true;
    el.preload = "metadata";
  } else {
    const imageShell = document.createElement("div");
    imageShell.className = "image-shell";

    el = document.createElement("img");
    el.src = baseUrl + file;

    const markLoaded = () => imageShell.classList.add("is-loaded");
    const markError = () => imageShell.classList.add("is-error");

    if (el.complete && el.naturalWidth > 0) {
      markLoaded();
    } else {
      el.addEventListener("load", markLoaded, { once: true });
      el.addEventListener("error", markError, { once: true });
    }
    imageShell.appendChild(el);
    wrapper.appendChild(imageShell);
  }

  if (!el.parentNode) wrapper.appendChild(el);

  const footer = container.querySelector(".meme-footer");
  if (footer) {
    container.insertBefore(wrapper, footer);
  } else {
    container.appendChild(wrapper);
  }

  state.loaded = true;
}
