export function ejectMedia(container, state) {
  const wrapper = container.querySelector(".media-shell");
  if (!wrapper || wrapper.classList.contains("media-placeholder")) return;

  const video = wrapper.querySelector("video");
  if (video) {
    video.pause();
    video.src = "";
    video.load();
  } else {
    const img = wrapper.querySelector("img");
    if (img) img.src = "";
  }

  const currentHeight = wrapper.offsetHeight;

  wrapper.remove();
  state.loaded = false;

  const placeholder = document.createElement("div");
  placeholder.className = "media-shell media-placeholder";
  placeholder.style.height = currentHeight > 0 ? `${currentHeight}px` : "200px";
  placeholder.style.background = "rgba(0,0,0,0)";

  const footer = container.querySelector(".meme-footer");
  if (footer) {
    container.insertBefore(placeholder, footer);
  } else {
    container.appendChild(placeholder);
  }
}
