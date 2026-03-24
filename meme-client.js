const $feed = $("#feed");
const initialQuery = new URLSearchParams(window.location.search).get("q") || "liberty";

const VOTE_API_URL = "http://localhost:8787"; // dev
function castMemeVote(state) {
  /*
  fetch(`${VOTE_API_URL}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memeId: file })
  }).catch(error => {
    console.error("Vote failed:", error);
  });
  */
  // TODO: vote by checksum, not just filename (to handle duplicates)
  console.log(state);
  console.log(`Casting vote for: ${state.file}`);
}

fetch("memes.json")
  .then(r => r.json())
  .then(files => {
    const $search = $("#search-input");
    let baseUrl = "http://localhost:8787/memes/";
    baseUrl = "https://m.marak.com/";
    const batchSize = 12;
    const AUTO_VOTE_MS = 3333;
    files = files
      .map(file => typeof file === "string" ? file : file.filename)
      .filter(Boolean);
    let filteredFiles = files;
    let index = 0;
    let loading = false;
    const votedMemes = new Set();
    const viewState = new WeakMap();

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
      state.timerId = setTimeout(function () {
        voteForMeme(state, true);
      }, Math.max(0, state.remainingMs));
    }

    function cleanupMemeState(container) {
      const state = viewState.get(container);
      if (!state) return;

      stopViewTimer(state, performance.now());
      autoVoteObserver.unobserve(container);
    }
    window.cleanupMemeState = cleanupMemeState;

    const autoVoteObserver = new IntersectionObserver(function (entries) {
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
      plusOne.style.position = "absolute";
      plusOne.style.left = "50%";
      plusOne.style.bottom = "50%";
      plusOne.style.transform = "translate(-50%, 0)";
      plusOne.style.color = "#7CFFB2";
      plusOne.style.fontSize = "16px";
      plusOne.style.fontWeight = "700";
      plusOne.style.opacity = "1";
      plusOne.style.pointerEvents = "none";
      plusOne.style.transition = "transform 500ms ease, opacity 500ms ease";
      voteWrap.appendChild(plusOne);

      requestAnimationFrame(function () {
        plusOne.style.transform = "translate(-50%, -24px)";
        plusOne.style.opacity = "0";
      });

      plusOne.addEventListener("transitionend", function () {
        plusOne.remove();
      }, { once: true });
    }

    function voteForMeme(state, isAutoVote) {
      console.log(`Attempting to vote for ${state.file} (auto: ${isAutoVote})`);
      if (votedMemes.has(state.file)) return false;

      state.voted = true;
      stopViewTimer(state, performance.now());
      autoVoteObserver.unobserve(state.container);
      votedMemes.add(state.file);
      castMemeVote(state);

      if (state.button) {
        state.button.disabled = true;
        state.button.style.opacity = "0";
        state.button.style.transform = "scale(0.9)";
        state.button.style.pointerEvents = "none";
      }

      triggerVoteAnimation(state.voteWrap);

      return true;
    }

    function createContainer(file) {
      const container = document.createElement("div");
      container.className = "meme";

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
        el.loading = "lazy";

        const markLoaded = function () {
          imageShell.classList.add("is-loaded");
        };

        const markError = function () {
          imageShell.classList.add("is-error");
        };

        if (el.complete) {
          if (typeof el.naturalWidth === "number" && el.naturalWidth > 0) {
            markLoaded();
          } else {
            markError();
          }
        } else {
          el.addEventListener("load", markLoaded, { once: true });
          el.addEventListener("error", markError, { once: true });
        }

        imageShell.appendChild(el);
        container.appendChild(imageShell);
      }

      if (!el.parentNode) {
        container.appendChild(el);
      }

      const footer = document.createElement("div");
      footer.style.display = "flex";
      footer.style.alignItems = "center";
      footer.style.justifyContent = "space-between";
      footer.style.gap = "12px";
      footer.style.padding = "8px 4px 0";
      footer.style.color = "rgba(255, 255, 255, 0.72)";
      footer.style.fontSize = "13px";

      const name = document.createElement("div");
      name.style.flex = "1";
      name.style.minWidth = "0";
      name.style.display = "flex";
      name.style.flexWrap = "wrap";
      name.style.gap = "6px";

      const tags = file
        .replace(/\.[^.]+$/, "")
        .split(/[._-]+/)
        .map(tag => tag.trim())
        .filter(Boolean);

      for (const tag of tags) {
        const tagButton = document.createElement("button");
        tagButton.type = "button";
        tagButton.textContent = tag;
        tagButton.style.border = "1px solid rgba(255, 255, 255, 0.18)";
        tagButton.style.borderRadius = "999px";
        tagButton.style.background = "rgba(255, 255, 255, 0.06)";
        tagButton.style.color = "white";
        tagButton.style.padding = "3px 8px";
        tagButton.style.cursor = "pointer";
        tagButton.style.fontSize = "12px";
        tagButton.style.lineHeight = "1.2";
        tagButton.addEventListener("click", function () {
          const currentTags = $search.val().trim().split(/\s+/).filter(Boolean);
          if (!currentTags.includes(tag)) {
            currentTags.push(tag);
          }
          const nextValue = currentTags.join(" ");
          $search.val(nextValue);
          applyFilter(nextValue);
        });
        name.appendChild(tagButton);
      }

      const voteWrap = document.createElement("div");
      voteWrap.style.position = "relative";
      voteWrap.style.display = "inline-flex";
      voteWrap.style.alignItems = "center";

      const voteButton = document.createElement("button");
      voteButton.type = "button";
      voteButton.textContent = "👍";
      voteButton.setAttribute("aria-label", `Vote for ${file}`);
      voteButton.style.border = "1px solid rgba(255, 255, 255, 0.18)";
      voteButton.style.borderRadius = "999px";
      voteButton.style.background = "rgba(255, 255, 255, 0.06)";
      voteButton.style.color = "white";
      voteButton.style.padding = "4px 10px";
      voteButton.style.cursor = "pointer";
      voteButton.style.fontSize = "14px";
      voteButton.style.lineHeight = "1";
      voteButton.style.transition = "opacity 160ms ease, transform 160ms ease";
      voteButton.addEventListener("click", function () {
        const state = viewState.get(container);
        if (!state || !voteForMeme(state, false)) return;
      });

      footer.appendChild(name);
      voteWrap.appendChild(voteButton);
      footer.appendChild(voteWrap);
      container.appendChild(footer);

      viewState.set(container, {
        container,
        file,
        button: voteButton,
        voteWrap,
        remainingMs: AUTO_VOTE_MS,
        visibleSince: null,
        timerId: null,
        voted: false
      });
      autoVoteObserver.observe(container);

      return container;
    }

    function renderBatch() {
      if (loading || index >= filteredFiles.length) return;

      loading = true;

      const fragment = document.createDocumentFragment();
      const end = Math.min(index + batchSize, filteredFiles.length);

      for (; index < end; index++) {
        const file = filteredFiles[index];
        const container = createContainer(file);
        fragment.appendChild(container);
      }

      $feed.append(fragment);

      // trimFeed(); // 👈 add this

      loading = false;
    }

    function applyFilter(query) {
      const normalizedQuery = query.trim().toLowerCase();
      const queryTags = normalizedQuery.split(/\s+/).filter(Boolean);
      filteredFiles = queryTags.length
        ? files.filter(file => {
            const normalizedFile = file.toLowerCase();
            return queryTags.every(tag => normalizedFile.includes(tag));
          })
        : files;
      index = 0;
      loading = false;
      Array.from($feed[0].children).forEach(cleanupMemeState);
      $feed.empty();
      renderBatch();
    }

    $(window).on("scroll", function () {
      if (loading || index >= filteredFiles.length) {
        return;
      }

      if ($(window).scrollTop() + $(window).height() >= $(document).height() - 600) {
        renderBatch();
      }
    });

    let searchDebounceTimeout;
    $search.on("input", function () {
      const value = this.value;
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(function () {
        applyFilter(value);
      }, 555);
    });

    if (initialQuery) {
      $search.val(initialQuery);
      applyFilter(initialQuery);
    } else {
      renderBatch();
    }
  });

const MAX_ITEMS = 5; // total DOM nodes to keep

function trimFeed() {
  console.log("Trimming feed...");
  const children = $feed[0].children;

  if (children.length <= MAX_ITEMS) return;

  const removeCount = children.length - MAX_ITEMS;

  for (let i = 0; i < removeCount; i++) {
    const el = children[0];
    if (typeof window.cleanupMemeState === "function") {
      window.cleanupMemeState(el);
    }

    // cleanup video memory
    const media = el.querySelector("video");
    if (media) {
      media.pause();
      media.src = "";
      media.load();
    }

    el.remove();
  }
}
