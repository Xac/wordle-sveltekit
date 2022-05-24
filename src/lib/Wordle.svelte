<script>
  import { fade } from 'svelte/transition';

  const LETTERS_PER_WORD = 5;
  const MAX_GUESSES = 6;

  const GUESS_PATH = '/guess';

  const tileStates = {
    pending: 'pending',
    inWord: 'in-word',
    inPlace: 'in-place',
    nowhere: 'nowhere',
    empty: 'empty'
  };

  const animations = {
    shake: 'animate-shake',
    jump: 'animate-jump'
  };

  // Reactive Data

  let results = [];
  let interactionDisabled = false;

  let messages = [];
  let clearMessageTimer = null;

  // UI

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['SP', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'SP'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const isBigKey = (key) => {
    return ['BACKSPACE', 'ENTER'].includes(key);
  };

  $: tileStatus = (index) => {
    return results[index]?.status || tileStates.empty;
  };

  $: keyStatus = (key) => {
    // Make sure inPlace is prioritized when guessed after inWord
    if (results.filter((r) => r.letter == key && r.status == tileStates.inPlace).length) {
      return tileStates.inPlace;
    }
    return results.find((r) => r.letter == key)?.status;
  };

  // Interactions

  const keyButtonPressed = (key) => {
    if (!interactionDisabled) {
      key = key.toUpperCase();
      if (key == 'ENTER') return submitWord();
      if (key == 'BACKSPACE') return backspace();
      if (key.match(/^[A-Z]$/)) addToCurrentGuess(key);
    }
  };

  const backspace = () => {
    if (results[results.length - 1]?.status == tileStates.pending) {
      results.pop();
      results = results;
    }
  };

  const addToCurrentGuess = (letter) => {
    if (currentGuessResults().length < LETTERS_PER_WORD) {
      results.push({ letter: letter, status: tileStates.pending });
      results = results;
    }
  };

  const handleKeydown = (event) => {
    keyButtonPressed(event.key);
  };

  // Animations
  const shakeCurrentGuess = () => {
    suspendInteraction();

    const animationEvents = currentGuessTiles().map((t) => animateTile(t, animations.shake));
    Promise.all(animationEvents).then(resumeInteraction);
  };

  const jumpLastGuess = () => {
    const jumps = lastGuessTiles().map((guess, i) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          animateTile(guess, animations.jump).then(resolve);
        }, i * 100);
      });
    });
    return Promise.all(jumps);
  };

  // Event parameter options - 'animation' or 'transition'
  const animateTile = (tile, animation, event = 'animation') => {
    return new Promise((resolve) => {
      tile.addEventListener(
        `${event}end`,
        () => {
          tile.classList.remove(animation);
          resolve();
        },
        { once: true }
      );
      tile.classList.add(animation);
    });
  };

  // Private

  const suspendInteraction = () => {
    interactionDisabled = true;
  };

  const resumeInteraction = () => {
    interactionDisabled = false;
  };

  const currentGuess = (key) => {
    return currentGuessResults()
      .map((l) => l.letter)
      .join('');
  };

  const clearLastMessage = () => {
    messages.pop();
    messages = messages;

    if (messages.length > 0) {
      if (clearMessageTimer) clearTimeout(clearMessageTimer);
      clearMessageTimer = setTimeout(clearLastMessage, 200);
    }
  };

  const addMessage = (message) => {
    messages.push(message);
    messages = messages;

    if (clearMessageTimer) clearTimeout(clearMessageTimer);
    clearMessageTimer = setTimeout(clearLastMessage, 1000);
  };

  const currentGuessResults = () => {
    return results.filter((r) => r.status == tileStates.pending);
  };

  const lastGuessResults = () => {
    if (results.length >= LETTERS_PER_WORD) {
      const nonPendingResults = results.filter((r) => r.status != tileStates.pending);
      return nonPendingResults.slice(LETTERS_PER_WORD * -1);
    }
  };

  const currentGuessTiles = () => {
    const tiles = Array.from(document.querySelectorAll('[data-tile]'));
    const firstPendingIndex = tiles.findIndex((l) => l.classList.contains(tileStates.pending));
    return tiles.slice(firstPendingIndex, firstPendingIndex + LETTERS_PER_WORD);
  };

  const lastGuessTiles = () => {
    const tiles = Array.from(
      document.querySelectorAll(`[data-tile]:not(.${tileStates.pending}, .${tileStates.empty})`)
    );
    return tiles.slice(LETTERS_PER_WORD * -1);
  };

  const revealGuessResult = (response) => {
    const guessTiles = currentGuessTiles();

    suspendInteraction();
    const flips = response.map((result, i) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          animateTile(guessTiles[i], 'flip-up', 'transition').then(() => {
            results[results.length - (LETTERS_PER_WORD - i)] = result;
            resolve();
          });
        }, i * 300);
      });
    });
    Promise.all(flips).then(() => {
      if (!checkWinOrLoss()) resumeInteraction();
    });
  };

  const checkWinOrLoss = () => {
    if (lastGuessWasCorrect()) return win();

    if (results.length == MAX_GUESSES * LETTERS_PER_WORD) {
      return lose();
    }

    return false;
  };

  const lastGuessWasCorrect = () => {
    return lastGuessResults().every((r) => r.status == tileStates.inPlace);
  };

  const lose = () => {
    addMessage('You lose');
    return true;
  };

  const win = () => {
    jumpLastGuess().then(() => addMessage('You win!'));
    return true;
  };

  // API

  async function submitWord() {
    suspendInteraction();

    const guess = currentGuess();
    if (guess.length != LETTERS_PER_WORD) {
      addMessage('Not enough letters');
      return shakeCurrentGuess();
    }

    const request = await fetch(GUESS_PATH, {
      method: 'POST',
      body: JSON.stringify({ guess })
    });

    const result = await request.json();

    // Both options will resume interaction on completion
    if (result.valid) {
      revealGuessResult(result.result);
    } else {
      addMessage('Not in word list');
      shakeCurrentGuess();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div id="wordle" data-wordle>
  <h1 class="mx-auto block text-center text-3xl mt-5 font-bold dark:text-white">Wordle</h1>

  <!-- Guesses -->
  <div class="relative mt-12 max-w-sm mx-auto px-2">
    <div
      class="absolute z-10 top-0 left-1/2 translate-x-[-50%] text-center flex flex-col space-y-2"
    >
      {#each messages as message, i (i)}
        <div
          out:fade={{ duration: 200 }}
          class="bg-zinc-800 dark:bg-white dark:text-black font-bold text-white px-4 py-3 rounded-md"
        >
          {message}
        </div>
      {/each}
    </div>
    <div
      class="grid gap-1"
      style={`grid-template-columns: repeat(${LETTERS_PER_WORD}, minmax(0, 1fr));`}
    >
      {#each Array(LETTERS_PER_WORD * MAX_GUESSES) as _, i}
        <div
          class={`tile text-3xl font-bold flex items-center transition-transform duration-300 ease-linear justify-center aspect-square ${tileStatus(
            i
          )}`}
          data-tile
        >
          {results[i]?.letter || ''}
        </div>
      {/each}
    </div>
  </div>

  <!-- Keyboard -->
  <div class="mx-auto max-w-md px-2 mt-20">
    {#each keyboard as row}
      <div class="mt-3 flex gap-2 items-center justify-center">
        {#each row as key}
          {#if key == 'SP'}
            <div class="flex-[0.5]" />
          {:else}
            <button
              on:click={() => keyButtonPressed(key)}
              class={`py-4 text-sm font-bold flex items-center justify-center bg-zinc-200 rounded shrink-0 dark:bg-zinc-500 dark:text-white ${keyStatus(
                key
              )} ${isBigKey(key) ? 'flex-[1.5]' : 'flex-1'}`}
              data-enter={key == 'ENTER'}
              data-bs={key == 'BS'}
            >
              {#if key == 'BACKSPACE'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="fill-black dark:fill-white"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path
                    d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"
                  />
                </svg>
              {:else}
                {key}
              {/if}
            </button>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .tile.empty {
    @apply border-zinc-300 dark:border-dark-gray border-2;
  }
  .in-word {
    @apply bg-yellow dark:bg-dark-yellow text-white;
  }
  .in-place {
    @apply bg-green dark:bg-dark-green text-white;
  }
  .nowhere {
    @apply bg-gray dark:bg-dark-gray text-white;
  }
  .tile.pending {
    @apply border-zinc-500 dark:border-dark-gray dark:text-white border-2;
  }
  .flip-up {
    transform: rotateX(90deg);
  }
</style>
