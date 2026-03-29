import { createContainer } from "./lib/createContainer.js";
import { filterFiles } from "./lib/filterFiles.js";
import { ejectMedia } from "./lib/ejectMedia.js";
import { injectMedia } from "./lib/injectMedia.js";
import { initializeMemeFeed } from "./lib/initializeMemeFeed.js";
import { initializeRainbowPrompt } from "./lib/initializeRainbowPrompt.js";

const $feed = document.querySelector("#feed");
const floatingOctocat = document.querySelector("#floating-octocat");
const initialQuery = new URLSearchParams(window.location.search).get("q") || "liberty";
const GITHUB_URL = "https://github.com/buddypond/meme-client";

const VOTE_API_URL = "http://localhost:8787"; // dev

function castMemeVote(state) {
  /* Remark: keep all commented out code for now
  fetch(`${VOTE_API_URL}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memeId: state.file })
  }).catch(error => {
    console.error("Vote failed:", error);
  });
  */
  console.log(state);
  console.log(`Casting vote for: ${state.file}`);
}

const focusSearchInput = () => document.querySelector("#search-input")?.focus();
const openGitHubRepo = () => window.open(GITHUB_URL, "_blank", "noopener,noreferrer");

if (floatingOctocat) {
  floatingOctocat.classList.add("is-interactive");
  floatingOctocat.addEventListener("mouseenter", () => {
    floatingOctocat.classList.add("is-hovered");
  });
  floatingOctocat.addEventListener("mouseleave", () => {
    floatingOctocat.classList.remove("is-hovered");
  });
  floatingOctocat.addEventListener("click", openGitHubRepo);
  floatingOctocat.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGitHubRepo();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", focusSearchInput, { once: true });
} else {
  focusSearchInput();
}

const searchInput = document.querySelector("#search-input");
initializeRainbowPrompt({ searchInput, initialQuery });

fetch("memes.json")
  .then(r => r.json())
  .then(files => initializeMemeFeed({
    files,
    feed: $feed,
    initialQuery,
    // castMemeVote,
    createContainer,
    filterFiles,
    ejectMedia,
    injectMedia
  }));
