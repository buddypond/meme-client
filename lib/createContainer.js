export function createContainer(file, options) {
  const {
    searchInput,
    applyFilter,
    viewState,
    autoVoteMs,
    voteForMeme,
    autoVoteObserver,
    mediaObserver
  } = options;

  const container = document.createElement("div");
  container.className = "meme";

  const placeholder = document.createElement("div");
  placeholder.className = "media-shell media-placeholder";
  placeholder.style.minHeight = "300px";
  placeholder.style.background = "#1a1a1a";

  container.appendChild(placeholder);

  const footer = document.createElement("div");
  footer.className = "meme-footer";
  Object.assign(footer.style, {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "12px", padding: "8px 4px 0", color: "rgba(255, 255, 255, 0.72)", fontSize: "13px"
  });

  const name = document.createElement("div");
  Object.assign(name.style, { flex: "1", minWidth: "0", display: "flex", flexWrap: "wrap", gap: "6px" });

  const tags = file.replace(/\.[^.]+$/, "").split(/[._-]+/).map(tag => tag.trim()).filter(Boolean);

  for (const tag of tags) {
    const tagButton = document.createElement("button");
    tagButton.type = "button";
    tagButton.textContent = tag;
    Object.assign(tagButton.style, {
      border: "1px solid rgba(255, 255, 255, 0.18)", borderRadius: "999px",
      background: "rgba(255, 255, 255, 0.06)", color: "white", padding: "3px 8px",
      cursor: "pointer", fontSize: "12px", lineHeight: "1.2"
    });
    tagButton.addEventListener("click", function() {
      const currentTags = searchInput.value.trim().split(/\s+/).filter(Boolean);
      if (!currentTags.includes(tag)) currentTags.push(tag);
      searchInput.value = currentTags.join(" ");
      applyFilter(currentTags.join(" "));
    });
    name.appendChild(tagButton);
  }

  const voteWrap = document.createElement("div");
  Object.assign(voteWrap.style, { position: "relative", display: "inline-flex", alignItems: "center" });

  const voteButton = document.createElement("button");
  voteButton.type = "button";
  voteButton.textContent = "👍";
  voteButton.setAttribute("aria-label", `Vote for ${file}`);
  Object.assign(voteButton.style, {
    border: "1px solid rgba(255, 255, 255, 0.18)", borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.06)", color: "white", padding: "4px 10px",
    cursor: "pointer", fontSize: "14px", lineHeight: "1",
    transition: "opacity 160ms ease, transform 160ms ease"
  });

  voteButton.addEventListener("click", () => {
    const state = viewState.get(container);
    if (state) voteForMeme(state, false);
  });

  footer.appendChild(name);
  voteWrap.appendChild(voteButton);
  footer.appendChild(voteWrap);
  container.appendChild(footer);

  const state = {
    container,
    file,
    button: voteButton,
    voteWrap,
    remainingMs: autoVoteMs,
    visibleSince: null,
    timerId: null,
    voted: false,
    loaded: false
  };

  viewState.set(container, state);

  autoVoteObserver.observe(container);
  mediaObserver.observe(container);

  return container;
}
