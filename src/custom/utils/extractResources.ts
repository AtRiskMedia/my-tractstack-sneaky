import type { ExtendedResourceNode as ResourceNode } from '@/custom/types';

export interface ExtractedResources {
  [category: string]: ResourceNode[];
}

/**
 * Groups resources by their category and sorts each category by rarity order
 * @param resources - Array of ResourceNode objects
 * @returns Object with category keys containing arrays of resources sorted by rarity
 */
export function extractResources(
  resources: ResourceNode[]
): ExtractedResources {
  const grouped = resources.reduce((acc: ExtractedResources, resource) => {
    const category =
      resource.categorySlug || resource.category || 'uncategorized';

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(resource);

    return acc;
  }, {});

  return grouped;
}
