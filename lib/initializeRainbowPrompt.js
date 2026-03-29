export function initializeRainbowPrompt({ searchInput, initialQuery }) {
  if (!searchInput || searchInput.dataset.rainbowPromptInitialized) {
    return;
  }

  searchInput.dataset.rainbowPromptInitialized = "true";

  const style = document.createElement("style");
  style.textContent = `
    @property --meme-rainbow-angle {
      syntax: "<angle>";
      inherits: false;
      initial-value: 0deg;
    }

    @keyframes meme-rainbow-spin {
      to {
        --meme-rainbow-angle: 360deg;
      }
    }

    @keyframes meme-rainbow-shimmer {
      0%, 100% {
        filter: saturate(1) brightness(1);
      }
      50% {
        filter: saturate(1.25) brightness(1.12);
      }
    }

    #search-input.meme-rainbow-prompt {
      border: 2px solid transparent;
      background-image:
        linear-gradient(rgb(15 23 42), rgb(15 23 42)),
        conic-gradient(
          from var(--meme-rainbow-angle),
          #ff4d6d,
          #ff9e00,
          #ffe600,
          #5bff98,
          #4dd2ff,
          #7a5cff,
          #ff4d6d
        );
      background-origin: border-box;
      background-clip: padding-box, border-box;
      box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.12),
        0 0 18px rgb(255 77 109 / 0.28),
        0 0 30px rgb(77 210 255 / 0.22);
      animation:
        meme-rainbow-spin 2.6s linear infinite,
        meme-rainbow-shimmer 1.8s ease-in-out infinite;
    }
  `;
  document.head.append(style);

  const removeRainbowPrompt = () => {
    searchInput.classList.remove("meme-rainbow-prompt");
    searchInput.removeEventListener("input", handleInput);
  };

  const handleInput = () => {
    if (searchInput.value !== initialQuery) {
      removeRainbowPrompt();
    }
  };

  searchInput.classList.add("meme-rainbow-prompt");
  searchInput.addEventListener("input", handleInput);
}
