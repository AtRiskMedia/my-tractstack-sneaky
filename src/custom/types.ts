import type { ResourceNode } from '@/types/compositorTypes';

// Extended ResourceNode with all fields from knownResources.json as optional
export interface ExtendedResourceNode extends ResourceNode {
  // Common fields across multiple categories
  body?: string[];
  type?: string;
  categorySlug?: string;
  rarityOrder?: number;
  tokenId?: number;
  attack?: string;
  profession?: string;
  special?: string;
  class?: string;
  species?: string;
  power?: number;
  sneakiness?: number;
  collection?: string;
}
