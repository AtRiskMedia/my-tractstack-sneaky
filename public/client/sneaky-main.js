(function () {
  const goBackend = 'https://sneaky.atriskmedia.com:10002';

  function triggerRehydration() {
    document.dispatchEvent(new CustomEvent('rehydrate-stores'));
  }

  function hydrateData() {
    const storedData = sessionStorage.getItem('sneaky-resources');
    const storedTimestamp = sessionStorage.getItem(
      'sneaky-resources-timestamp'
    );
    const TTL = 15 * 60 * 1000; // 15 minutes

    if (storedData && storedTimestamp) {
      const age = Date.now() - parseInt(storedTimestamp, 10);
      if (age < TTL) {
        return;
      }
    }

    const CATEGORIES = [
      `class`,
      `species`,
      `profession`,
      `attack`,
      `special`,
      `people`,
      `animals`,
      `stuff`,
    ];

    fetch(`${goBackend}/api/v1/nodes/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': 'default' },
      body: JSON.stringify({ categories: CATEGORIES }),
    })
      .then((response) => response.json())
      .then((responseData) => {
        if (responseData.resources) {
          const grouped = responseData.resources.reduce((acc, resource) => {
            const category =
              resource.categorySlug || resource.category || 'uncategorized';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(resource);
            return acc;
          }, {});

          sessionStorage.setItem('sneaky-resources', JSON.stringify(grouped));
          sessionStorage.setItem(
            'sneaky-resources-timestamp',
            Date.now().toString()
          );

          triggerRehydration();
        }
      });
  }

  hydrateData();

  document.addEventListener('astro:page-load', triggerRehydration);
  document.addEventListener('astro:after-swap', triggerRehydration);
})();
