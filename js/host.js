/* Loaded in <head>: flag the native macOS app host before first paint (index.html?host=app). */
(function () {
  if (new URLSearchParams(location.search).get('host') === 'app') document.documentElement.dataset.host = 'app';
})();
