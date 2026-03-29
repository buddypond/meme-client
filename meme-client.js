import { createContainer } from "./lib/createContainer.js";
import { filterFiles } from "./lib/filterFiles.js";
import { ejectMedia } from "./lib/ejectMedia.js";
import { injectMedia } from "./lib/injectMedia.js";
import { initializeMemeFeed } from "./lib/initializeMemeFeed.js";

const $feed = document.querySelector("#feed");
const initialQuery = new URLSearchParams(window.location.search).get("q") || "liberty";

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
