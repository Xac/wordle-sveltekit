import words from '$lib/words.json';

const START_DATE = new Date('2022-05-21');

const todaysWord = () => {
  const offsetMs = Date.now() - START_DATE;
  const offsetDays = offsetMs / 1000 / 60 / 60 / 24;
  return words[Math.floor(offsetDays)].word;
};

const letterStatus = (letter, index, placedIndexes) => {
  const word = todaysWord();

  // Nice.
  if (word[index] == letter) {
    return 'in-place';
  }

  // Letter doesn't appear in the word at all.
  const guessIndex = word.indexOf(letter);
  if (guessIndex < 0) {
    return 'nowhere';
  }

  // They have already guessed this letter in all correct places, return 'nowhere' to show there are no
  // additional instances of this lettter in the word.
  placedLetters = placedIndexes.filter((i) => word[i] == letter);
  occurrenceIndexes = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      occurrenceIndexes.push(i);
    }
  }
  if (occurrenceIndexes.length == placedLetters.length) {
    return 'nowhere';
  }

  // Must be in word, but in the wrong place.
  return 'in-word';
};

const wordIsValid = (word) => {
  return words.find((w) => w.word == word);
};

export const post = async ({ request }) => {
  const body = await request.json();
  const guess = body.guess;
  const placedIndexes = [];

  if (wordIsValid(guess)) {
    const guessResults = [];

    guess.split('').forEach((letter, index) => {
      const status = letterStatus(letter, index, placedIndexes);
      if (status == 'in-place') placedIndexes.push(index);
      guessResults.push({ letter, status: status });
    });

    return { body: { valid: true, result: guessResults } };
  } else {
    return { body: { valid: false } };
  }
};
