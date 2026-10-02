(() => {
  const shuffle = (items) => {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  };

  // Returns every image once in a random order, then starts a new cycle.
  // `excluded` keeps images currently visible in the grid from being reused.
  window.createImageDeck = (images) => {
    const uniqueImages = [...new Set(images)];
    let remaining = [];

    if (uniqueImages.length === 0) {
      throw new Error("An image deck needs at least one image.");
    }

    const refill = () => {
      remaining = shuffle(uniqueImages);
    };

    const next = (excluded = []) => {
      if (remaining.length === 0) refill();

      const excludedImages = new Set(excluded);
      let index = remaining.length - 1;

      while (index >= 0 && excludedImages.has(remaining[index])) index -= 1;

      // This fallback only matters if a caller excludes every image in the deck.
      if (index < 0) index = remaining.length - 1;

      return remaining.splice(index, 1)[0];
    };

    return { next, size: uniqueImages.length };
  };
})();
