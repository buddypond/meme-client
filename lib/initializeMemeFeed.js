export function initializeMemeFeed({
  files,
  feed,
  initialQuery,
  castMemeVote,
  createContainer,
  filterFiles,
  ejectMedia,
  injectMedia
}) {
  const search = document.querySelector("#search-input");
  let baseUrl = "http://localhost:8787/memes/";
  baseUrl = "https://m.marak.com/";

  const batchSize = 15;
  const AUTO_VOTE_MS = 3333;
  const LOAD_BUFFER_MARGIN = "600px";
  const MAX_DOM_ITEMS = 40;

  files = files
    .map(file => typeof file === "string" ? file : file.filename)
    .filter(Boolean);

  let filteredFiles = files;
  let index = 0;
  let loading = false;
  const votedMemes = new Set();
  const viewState = new WeakMap();

  const scrollSentinelObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading) {
      renderBatch();
    }
  }, { rootMargin: "200px", threshold: 0 });

  const mediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const container = entry.target;
      const state = viewState.get(container);
      if (!state) return;

      if (entry.isIntersecting) {
        if (!state.loaded) {
          injectMedia(container, state, baseUrl);
        }
      } else if (state.loaded) {
        ejectMedia(container, state);
      }
    });
  }, { rootMargin: `${LOAD_BUFFER_MARGIN} 0px`, threshold: 0 });

  function stopViewTimer(state, now) {
    if (state.visibleSince === null) return;
    clearTimeout(state.timerId);
    state.timerId = null;
    state.remainingMs -= now - state.visibleSince;
    state.visibleSince = null;
  }

  function startViewTimer(state, now) {
    if (state.voted || state.visibleSince !== null) return;
    state.visibleSince = now;
    state.timerId = setTimeout(() => voteForMeme(state, true), Math.max(0, state.remainingMs));
  }

  function cleanupMemeState(container) {
    const state = viewState.get(container);
    if (!state) return;
    stopViewTimer(state, performance.now());

    autoVoteObserver.unobserve(container);
    mediaObserver.unobserve(container);

    const wrapper = container.querySelector(".media-shell");
    if (wrapper) {
      const video = wrapper.querySelector("video");
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
      wrapper.remove();
    }
    state.loaded = false;
  }
  window.cleanupMemeState = cleanupMemeState;

  const autoVoteObserver = new IntersectionObserver((entries) => {
    const now = performance.now();
    for (const entry of entries) {
      const state = viewState.get(entry.target);
      if (!state || state.voted) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        startViewTimer(state, now);
      } else {
        stopViewTimer(state, now);
      }
    }
  }, { threshold: [0.6] });

  function triggerVoteAnimation(voteWrap) {
    if (!voteWrap) return;
    const plusOne = document.createElement("span");
    plusOne.textContent = "+1";
    Object.assign(plusOne.style, {
      position: "absolute",
      left: "50%",
      bottom: "50%",
      transform: "translate(-50%, 0)",
      color: "#7CFFB2",
      fontSize: "16px",
      fontWeight: "700",
      opacity: "1",
      pointerEvents: "none",
      transition: "transform 500ms ease, opacity 500ms ease"
    });
    voteWrap.appendChild(plusOne);
    requestAnimationFrame(() => {
      plusOne.style.transform = "translate(-50%, -24px)";
      plusOne.style.opacity = "0";
    });
    plusOne.addEventListener("transitionend", () => plusOne.remove(), { once: true });
  }

  function voteForMeme(state, isAutoVote) {
    if (votedMemes.has(state.file)) return false;
    state.voted = true;
    stopViewTimer(state, performance.now());
    autoVoteObserver.unobserve(state.container);
    votedMemes.add(state.file);
    castMemeVote(state, isAutoVote);

    if (state.button) {
      state.button.disabled = true;
      state.button.style.opacity = "0";
      state.button.style.transform = "scale(0.9)";
      state.button.style.pointerEvents = "none";
    }
    triggerVoteAnimation(state.voteWrap);
    return true;
  }

  let sentinel = document.querySelector("#infinite-scroll-sentinel");
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.id = "infinite-scroll-sentinel";
    sentinel.style.height = "10px";
    sentinel.style.width = "100%";
    feed.insertAdjacentElement("afterend", sentinel);
  }
  scrollSentinelObserver.observe(sentinel);

  function renderBatch() {
    if (loading || index >= filteredFiles.length) return;
    loading = true;

    const fragment = document.createDocumentFragment();
    const end = Math.min(index + batchSize, filteredFiles.length);

    for (; index < end; index++) {
      const file = filteredFiles[index];
      const container = createContainer(file, {
        searchInput: search,
        applyFilter,
        viewState,
        autoVoteMs: AUTO_VOTE_MS,
        voteForMeme,
        autoVoteObserver,
        mediaObserver
      });
      fragment.appendChild(container);
    }

    feed.appendChild(fragment);
    trimFeed();
    loading = false;
  }

  function trimFeed() {
    const children = feed.children;
    if (children.length <= MAX_DOM_ITEMS) return;

    const removeCount = children.length - MAX_DOM_ITEMS;

    for (let i = 0; i < removeCount; i++) {
      const el = children[0];
      if (typeof window.cleanupMemeState === "function") {
        window.cleanupMemeState(el);
      }
      el.remove();
    }
  }

  function applyFilter(query) {
    filteredFiles = filterFiles(files, query);
    index = 0;
    loading = false;

    Array.from(feed.children).forEach(cleanupMemeState);
    feed.replaceChildren();

    renderBatch();
  }

  let searchDebounceTimeout;
  search.addEventListener("input", function() {
    const value = this.value;
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => applyFilter(value), 555);
  });

  if (initialQuery) {
    search.value = initialQuery;
    applyFilter(initialQuery);
  } else {
    renderBatch();
  }
}
