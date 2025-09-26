import { allResources } from '@/custom/store/sneaky';

const VERBOSE = false;
const MAX_LENGTH = 200;

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
export const hasCustomImages = [`attack`, `class`];
export const hasCustomImage = [
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
  const resources = allResources.get();
  if (VERBOSE) {
    console.log('getResourceImage called:', { id, slug, category });
    console.log('current resources in store:', resources);
    console.log('store keys:', Object.keys(resources));
  }

  // For character resources (animals/people/stuff)
  if (category === 'animals' || category === 'people' || category === 'stuff') {
    if (VERBOSE) console.log('Processing character for OG image:', category);

    const collection = resources[category];
    if (collection) {
      const resource = collection.find((r: any) => r.id === id);
      if (resource?.optionsPayload?.tokenId) {
        const categoryCapitalized =
          category.charAt(0).toUpperCase() + category.slice(1);
        const imagePath = `/media/custom/og/Sneaky${categoryCapitalized}_${resource.optionsPayload.tokenId}_350px.webp`;
        if (VERBOSE) console.log('OG image path:', imagePath);
        return imagePath;
      }
    }

    if (VERBOSE) console.log('Fallback to static.jpg');
    return '/static.jpg';
  }

  // For class and attack traits, use trait image logic
  if (hasCustomImages.includes(category)) {
    const name = slug.replace(`${category}-`, '');
    const useCustom = hasCustomImage.includes(slug);
    const path = category === 'class' ? 'classes' : `${category}s`;

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
export function getResourceDescription(
  id: string,
  slug: string,
  category: string
): string | null {
  const resources = allResources.get();
  if (VERBOSE)
    console.log(`getResourceDescription`, resources, id, slug, category);

  // For character resources (animals/people/stuff), look up by id
  if (category === 'animals' || category === 'people' || category === 'stuff') {
    const collection = resources[category];
    if (collection) {
      if (VERBOSE) {
        console.log(
          `Looking for ID ${id} in collection:`,
          collection.slice(0, 3).map((r) => ({ id: r.id, slug: r.slug }))
        );
      }
      const resource = collection.find((r: any) => r.id === id);
      if (VERBOSE)
        console.log(
          `Found resource:`,
          resource
            ? {
                id: resource.id,
                slug: resource.slug,
                hasBody: !!resource.optionsPayload?.body,
              }
            : 'NOT FOUND'
        );

      if (resource?.optionsPayload?.body) {
        if (VERBOSE) console.log(`RAW BODY:`, resource.optionsPayload.body);

        let description = Array.isArray(resource.optionsPayload.body)
          ? resource.optionsPayload.body[0]
          : resource.optionsPayload.body;

        if (VERBOSE) console.log(`EXTRACTED DESCRIPTION:`, description);
        if (VERBOSE) console.log(`DESCRIPTION TYPE:`, typeof description);
        if (VERBOSE) console.log(`DESCRIPTION LENGTH:`, description?.length);

        if (description && description.length > MAX_LENGTH) {
          description = description.substring(0, MAX_LENGTH).trim() + '...';
          if (VERBOSE) console.log(`TRUNCATED DESCRIPTION:`, description);
        }

        if (VERBOSE) console.log(`RETURNING DESCRIPTION:`, description);
        return description;
      } else {
        if (VERBOSE) console.log(`NO BODY FOUND for character resource`);
      }
    } else {
      if (VERBOSE) console.log(`NO COLLECTION FOUND for category:`, category);
    }
  }

  // For trait resources, look up by slug
  if (hasCustomImages.includes(category)) {
    const collection = resources[category];
    if (collection) {
      if (VERBOSE) {
        console.log(
          `Looking for SLUG ${slug} in ${category} collection:`,
          collection.slice(0, 3).map((r) => ({ id: r.id, slug: r.slug }))
        );
      }
      const resource = collection.find((r: any) => r.slug === slug);
      if (VERBOSE)
        console.log(
          `Found resource:`,
          resource
            ? {
                id: resource.id,
                slug: resource.slug,
                hasBody: !!resource.optionsPayload?.body,
              }
            : 'NOT FOUND'
        );

      if (resource?.optionsPayload?.body) {
        if (VERBOSE) console.log(`RAW BODY:`, resource.optionsPayload.body);

        let description = Array.isArray(resource.optionsPayload.body)
          ? resource.optionsPayload.body[0]
          : resource.optionsPayload.body;

        if (VERBOSE) console.log(`EXTRACTED DESCRIPTION:`, description);
        if (VERBOSE) console.log(`DESCRIPTION TYPE:`, typeof description);
        if (VERBOSE) console.log(`DESCRIPTION LENGTH:`, description?.length);

        if (description && description.length > MAX_LENGTH) {
          description = description.substring(0, MAX_LENGTH).trim() + '...';
          if (VERBOSE) console.log(`TRUNCATED DESCRIPTION:`, description);
        }

        if (VERBOSE) console.log(`RETURNING DESCRIPTION:`, description);
        return description;
      } else {
        if (VERBOSE) console.log(`NO BODY FOUND for trait resource`);
      }
    } else {
      if (VERBOSE) console.log(`NO COLLECTION FOUND for category:`, category);
    }
  }

  if (VERBOSE) console.log(`RETURNING NULL - no description found`);
  return null;
}
