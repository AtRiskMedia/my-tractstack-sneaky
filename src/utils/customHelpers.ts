import { allResources } from '@/custom/store/sneaky';

const VERBOSE = false;

// URL Helper: Strip category prefix from slug
// e.g., "people-bleako" -> "bleako"
export function getCleanSlug(categorySlug: string, fullSlug: string): string {
  if (VERBOSE) console.log('getCleanSlug called:', { categorySlug, fullSlug });
  const prefix = `${categorySlug}-`;
  const result = fullSlug.startsWith(prefix)
    ? fullSlug.slice(prefix.length)
    : fullSlug;
  if (VERBOSE) console.log('getCleanSlug result:', result);
  return result;
}

// Build proper URL for resource
// e.g., category="people", slug="people-bleako" -> "/people/bleako"
export function getResourceUrl(categorySlug: string, fullSlug: string): string {
  if (VERBOSE)
    console.log('getResourceUrl called:', { categorySlug, fullSlug });
  const cleanSlug = getCleanSlug(categorySlug, fullSlug);
  const result = `/${categorySlug}/${cleanSlug}`;
  if (VERBOSE) console.log('getResourceUrl result:', result);
  return result;
}

// List of traits that have custom images
const hasCustomImage = [
  'class-timberbeast',
  'class-amish',
  'class-woke',
  'class-cartel',
  'class-fantasy',
  'class-connoisseur',
  'class-wounded',
  'class-alien',
  'class-pirate',
  'class-jock',
  'class-robot',
  'class-billionaire',
  'class-legend',
  'class-filthy',
  'class-extinct',
  'class-the-band',
  'class-evil',
  'class-inbred',
  'class-skeleton',
  'class-shopkeeper',
  'class-outsiders',
  'class-mutant',
  'class-royal',
  'class-zombie',
  'class-wizard',
  'class-guardian',
  'class-media',
  'class-hipster',
  'class-deranged',
  'attack-abyss-gaze',
  'attack-army-of-animals',
  'attack-assault-rifle',
  'attack-awful-breath',
  'attack-awful-smell',
  'attack-bad-confidence',
  'attack-bark',
  'attack-beard-tickle',
  'attack-bend-and-break',
  'attack-berry-blast',
  'attack-big-belly-crush',
  'attack-big-blow',
  'attack-bite',
  'attack-blazing-breath',
  'attack-blinding-lights',
  'attack-blood-cannon',
  'attack-brainstorm',
  'attack-brown-banana',
  'attack-burn',
  'attack-burning-tale',
  'attack-burst-balloon',
  'attack-camouflage',
  'attack-cheat',
  'attack-chocolate-poison',
  'attack-chopstick-jab',
  'attack-cigar-burn',
  'attack-cigarette-burn',
  'attack-clean-dirt',
  'attack-club-attack',
  'attack-color-bomb',
  'attack-comfort',
  'attack-confundo',
  'attack-cover-strike',
  'attack-creeping-venom',
  'attack-cringe-behaviour',
  'attack-cuff-slam',
  'attack-cursed-coin',
  'attack-cut',
  'attack-cutlery-swing',
  'attack-dab',
  'attack-deep-throat',
  'attack-deep-voice',
  'attack-desperate-plea',
  'attack-disguise',
  'attack-double-bag-swing',
  'attack-double-banana',
];

// Module-level loading state
let isLoading = false;
let hasInitialized = false;

// Initialize search data with idempotent fetch
export function initSearch(): void {
  if (VERBOSE)
    console.log(
      'initSearch called - hasInitialized:',
      hasInitialized,
      'isLoading:',
      isLoading
    );

  if (hasInitialized || isLoading) {
    if (VERBOSE)
      console.log('initSearch early return - already initialized or loading');
    return;
  }

  // Check if data is already loaded in the store
  const currentResources = allResources.get();
  if (VERBOSE) {
    console.log('checking allResources store:', currentResources);
    console.log('store keys:', Object.keys(currentResources));
  }

  if (Object.keys(currentResources).length > 0) {
    if (VERBOSE) console.log('data already in store, marking as initialized');
    hasInitialized = true;
    return;
  }

  // Check if data is already in sessionStorage
  if (VERBOSE) console.log('checking sessionStorage for sneaky-resources');
  const storedData = sessionStorage.getItem('sneaky-resources');
  const storedTimestamp = sessionStorage.getItem('sneaky-resources-timestamp');
  if (VERBOSE) {
    console.log('sessionStorage data exists:', !!storedData);
    console.log('sessionStorage timestamp exists:', !!storedTimestamp);
  }

  const TTL = 15 * 60 * 1000; // 15 minutes

  if (storedData && storedTimestamp) {
    const age = Date.now() - parseInt(storedTimestamp, 10);
    if (VERBOSE) console.log('sessionStorage age (ms):', age, 'TTL:', TTL);

    if (age < TTL) {
      if (VERBOSE) console.log('using cached sessionStorage data');
      // Use cached data
      try {
        const data = JSON.parse(storedData);
        if (VERBOSE) {
          console.log('parsed sessionStorage data:', data);
          console.log('setting allResources store');
        }
        allResources.set(data);
        hasInitialized = true;
        if (VERBOSE)
          console.log('initSearch completed using sessionStorage cache');
        return;
      } catch (error) {
        console.error('Failed to parse cached resources:', error);
      }
    } else {
      if (VERBOSE) console.log('sessionStorage data expired, will fetch fresh');
    }
  } else {
    if (VERBOSE) console.log('no valid sessionStorage data found');
  }

  // Fetch fresh data
  if (VERBOSE) console.log('starting fresh fetch');
  isLoading = true;
  const goBackend = 'https://sneaky.atriskmedia.com:10002';
  const CATEGORIES = [
    'class',
    'species',
    'profession',
    'attack',
    'special',
    'people',
    'animals',
    'stuff',
  ];

  if (VERBOSE) {
    console.log('fetching from:', goBackend);
    console.log('categories:', CATEGORIES);
  }

  fetch(`${goBackend}/api/v1/nodes/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': 'default' },
    body: JSON.stringify({ categories: CATEGORIES }),
  })
    .then((response) => {
      if (VERBOSE) console.log('fetch response status:', response.status);
      return response.json();
    })
    .then((responseData) => {
      if (VERBOSE) console.log('fetch response data:', responseData);

      if (responseData.resources) {
        if (VERBOSE)
          console.log('processing', responseData.resources.length, 'resources');

        const grouped = responseData.resources.reduce(
          (acc: any, resource: any) => {
            const category =
              resource.categorySlug || resource.category || 'uncategorized';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(resource);
            return acc;
          },
          {}
        );

        if (VERBOSE) {
          console.log('grouped resources:', grouped);
          console.log('grouped keys:', Object.keys(grouped));
        }

        // Store in sessionStorage
        if (VERBOSE) console.log('storing in sessionStorage');
        sessionStorage.setItem('sneaky-resources', JSON.stringify(grouped));
        sessionStorage.setItem(
          'sneaky-resources-timestamp',
          Date.now().toString()
        );

        // Store in nanostore
        if (VERBOSE) console.log('storing in allResources store');
        allResources.set(grouped);
        hasInitialized = true;
        isLoading = false;
        if (VERBOSE) console.log('initSearch completed with fresh fetch');
      } else {
        if (VERBOSE) console.error('no resources in response data');
        isLoading = false;
      }
    })
    .catch((error) => {
      console.error('Failed to fetch resources:', error);
      isLoading = false;
    });
}

// Image Helper: Generate image URLs for both characters and traits
export function getResourceImage(
  id: string,
  slug: string,
  category: string
): string {
  console.log('getResourceImage called:', { id, slug, category });
  const resources = allResources.get();
  if (VERBOSE) {
    console.log('current resources in store:', resources);
    console.log('store keys:', Object.keys(resources));
  }

  // For character resources (animals/people/stuff), look up tokenId
  if (category === 'animals' || category === 'people' || category === 'stuff') {
    if (VERBOSE)
      console.log('processing character resource for category:', category);

    const collection = resources[category];
    if (VERBOSE) {
      console.log('collection for', category, ':', collection);
      console.log(
        'collection length:',
        collection ? collection.length : 'undefined'
      );
    }

    if (collection) {
      if (VERBOSE) console.log('searching for resource with id:', id);
      const resource = collection.find((r: any) => r.id === id);
      if (VERBOSE) console.log('found resource:', resource);

      if (
        resource &&
        resource.optionsPayload &&
        resource.optionsPayload.tokenId
      ) {
        const categoryCapitalized =
          category.charAt(0).toUpperCase() + category.slice(1);
        const imagePath = `/media/custom/Sneaky${categoryCapitalized}/Sneaky${categoryCapitalized}_${resource.optionsPayload.tokenId}_450px.webp`;
        if (VERBOSE) console.log('character image path:', imagePath);
        return imagePath;
      } else {
        if (VERBOSE) console.log('resource not found or missing tokenId');
      }
    } else {
      if (VERBOSE) console.log('no collection found for category:', category);
    }

    if (VERBOSE) console.log('returning static.jpg for character');
    return '/static.jpg';
  }

  // For class and attack traits, use trait image logic
  if (category === 'class' || category === 'attack') {
    if (VERBOSE)
      console.log('processing trait resource for category:', category);

    const name = slug.replace(`${category}-`, '');
    const useCustom = hasCustomImage.includes(slug);
    const path = category === 'class' ? 'classes' : `${category}s`;

    if (VERBOSE) {
      console.log('trait name:', name);
      console.log('use custom image:', useCustom);
      console.log('image path:', path);
    }

    let imagePath;
    if (useCustom) {
      imagePath = `/media/custom/${path}/${category}-${name}_450px.webp`;
    } else {
      imagePath = `/media/custom/${path}/${category}_450px.webp`;
    }

    if (VERBOSE) console.log('trait image path:', imagePath);
    return imagePath;
  }

  // For all other categories, use static fallback
  if (VERBOSE) console.log('using static fallback for category:', category);
  return '/static.jpg';
}
