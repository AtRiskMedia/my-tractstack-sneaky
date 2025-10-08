import { useState } from 'react';
import type { ReactNode } from 'react';
import { RadioGroup } from '@ark-ui/react/radio-group';
import { ulid } from 'ulid';
import VisualBreakPreview from '@/components/compositor/preview/VisualBreakPreview';
import { getTemplateVisualBreakPane } from '@/utils/compositor/TemplatePanes';
import { fullContentMapStore } from '@/stores/storykeep';
import type { NodesContext } from '@/stores/nodes';
import { findUniqueSlug } from '@/utils/helpers';
import { tailwindToHex } from '@/utils/compositor/tailwindColors';
import { SvgBreaks } from '@/constants/shapes';
import type { StoryFragmentNode, TemplatePane } from '@/types/compositorTypes';

// Layout options with IDs, labels, and descriptions
const layoutOptions = [
  {
    id: 'featured-only',
    label: 'Featured Content Only',
    description: 'A hero section highlighting your most important content',
  },
  {
    id: 'featured-list',
    label: 'Featured with List',
    description: 'Hero section with a supporting content grid below',
  },
  {
    id: 'complete-home',
    label: 'Complete Home Layout',
    description: 'Hero section, visual break, and supporting content grid',
  },
];

// Visual break variants for selection
const breakVariants = [
  { id: 'cutwide2', label: 'Wave Cut', odd: true },
  { id: 'cutwide1', label: 'Diagonal Cut', odd: true },
  { id: 'burstwide2', label: 'Burst', odd: false },
  { id: 'crookedwide', label: 'Crooked', odd: false },
];

interface PageCreationSpecialProps {
  nodeId: string;
  ctx: NodesContext;
}

const PageCreationSpecial = ({
  nodeId,
  ctx,
}: PageCreationSpecialProps): ReactNode => {
  // State for layout and visual break selection
  const [selectedLayout, setSelectedLayout] = useState(layoutOptions[0].id);
  const [selectedBreak, setSelectedBreak] = useState(breakVariants[0].id);
  const [isCreating, setIsCreating] = useState(false);

  const existingSlugs = fullContentMapStore
    .get()
    .filter((item) => ['Pane', 'StoryFragment'].includes(item.type))
    .map((item) => item.slug);

  // CSS for RadioGroup styling
  const radioGroupStyles = `
    .radio-control[data-state="unchecked"] .radio-dot {
      background-color: #d1d5db; /* gray-300 */
    }
    .radio-control[data-state="checked"] .radio-dot {
      background-color: #0891b2; /* cyan-600 */
    }
    .radio-control[data-state="checked"] {
      border-color: #0891b2;
    }
    .radio-item[data-state="checked"] {
      border-color: #0891b2;
      background-color: #ecfeff; /* cyan-50 */
    }
  `;

  // Function to handle continue/apply button
  const handleApply = async () => {
    if (!selectedLayout) return; // Null check

    try {
      setIsCreating(true);

      // Get the storyfragment node
      const storyfragment = ctx.allNodes.get().get(nodeId) as StoryFragmentNode;
      if (!storyfragment) {
        console.error('Story fragment not found');
        return;
      }

      // Create panes array to hold the IDs of all panes we'll create
      const paneIds: string[] = [];

      // 1. Create Featured Content pane
      const featuredContentPane: TemplatePane = {
        id: ulid(),
        nodeType: 'Pane',
        title: 'Featured Article',
        slug: findUniqueSlug(`featured-article`, existingSlugs),
        isDecorative: false,
        parentId: nodeId,
        codeHookTarget: 'featured-article',
        codeHookPayload: {
          options: JSON.stringify({
            title: 'Featured Article',
          }),
        },
      };

      // Add the featured content pane
      const featuredContentId = ctx.addTemplatePane(
        nodeId,
        featuredContentPane
      );
      if (featuredContentId) {
        paneIds.push(featuredContentId);
      }

      // If layout includes visual break + list content
      if (selectedLayout === 'complete-home') {
        // Get the selected break variant
        const breakVariant = breakVariants.find((b) => b.id === selectedBreak);
        const bgColor = breakVariant?.odd ? 'white' : 'gray-50';
        const fillColor = breakVariant?.odd ? 'gray-50' : 'white';

        const shapeName = `kCz${selectedBreak}`;
        const isFlipped = SvgBreaks[shapeName]?.flipped || false;

        const finalBgColor = tailwindToHex(
          isFlipped ? fillColor : bgColor,
          null
        );
        const finalFillColor = tailwindToHex(
          isFlipped ? bgColor : fillColor,
          null
        );

        // 2. Create Visual Break pane
        const visualBreakTemplate = getTemplateVisualBreakPane(selectedBreak);
        visualBreakTemplate.id = ulid();
        visualBreakTemplate.title = 'Visual Break';
        visualBreakTemplate.slug = `${storyfragment.slug}-visual-break`;
        visualBreakTemplate.bgColour = finalBgColor;

        // Configure the SVG fill color
        if (visualBreakTemplate.bgPane) {
          if (visualBreakTemplate.bgPane.type === 'visual-break') {
            if (visualBreakTemplate.bgPane.breakDesktop) {
              visualBreakTemplate.bgPane.breakDesktop.svgFill = finalFillColor;
            }
            if (visualBreakTemplate.bgPane.breakTablet) {
              visualBreakTemplate.bgPane.breakTablet.svgFill = finalFillColor;
            }
            if (visualBreakTemplate.bgPane.breakMobile) {
              visualBreakTemplate.bgPane.breakMobile.svgFill = finalFillColor;
            }
          }
        }

        // Add the visual break pane
        const visualBreakId = ctx.addTemplatePane(nodeId, visualBreakTemplate);
        if (visualBreakId) {
          paneIds.push(visualBreakId);
        }
      }

      // If layout includes list content
      if (
        selectedLayout === 'featured-list' ||
        selectedLayout === 'complete-home'
      ) {
        // 3. Create List Content pane
        const listContentPane: TemplatePane = {
          id: ulid(),
          nodeType: 'Pane',
          title: 'Content List',
          slug: `${storyfragment.slug}-content-list`,
          isDecorative: false,
          parentId: nodeId,
          // For complete-home layout, match the background color with the visual break
          bgColour: tailwindToHex(
            selectedLayout === 'complete-home' ? 'gray-50' : 'white',
            null
          ),
          codeHookTarget: 'list-content',
          codeHookPayload: {
            options: JSON.stringify({
              title: 'More Articles',
              sortByPopular: 'true',
              showTopics: 'true',
              showDate: 'true',
              limit: '10',
              category: '',
            }),
          },
        };

        // Add the list content pane
        const listContentId = ctx.addTemplatePane(nodeId, listContentPane);
        if (listContentId) {
          paneIds.push(listContentId);
        }
      }

      // Update the storyfragment with the new panes
      if (paneIds.length > 0) {
        storyfragment.paneIds = paneIds;
        storyfragment.isChanged = true;
        ctx.modifyNodes([storyfragment]);
        ctx.notifyNode('root');
      }

      // Set title and slug if they're not set
      if (!storyfragment.title || !storyfragment.slug) {
        const updatedFragment = {
          ...storyfragment,
          title: storyfragment.title || 'Home Page',
          slug: storyfragment.slug || 'home',
          isChanged: true,
        };
        ctx.modifyNodes([updatedFragment]);
      }
    } catch (error) {
      console.error('Error creating special layout:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-md bg-white p-6">
      <style>{radioGroupStyles}</style>
      <div className="text-mydarkgrey mb-6 space-y-6 italic">
        <strong>Note:</strong> when editing web pages (story fragments) be sure
        to click on Topics &amp; Details for each page; (if you see no articles,
        that's why!)
      </div>
      <div className="mb-6 space-y-6">
        <div>
          <RadioGroup.Root
            defaultValue={selectedLayout}
            onValueChange={(details) => {
              if (details.value) {
                setSelectedLayout(details.value);
              }
            }}
          >
            <RadioGroup.Label className="text-lg font-bold">
              Select Layout
            </RadioGroup.Label>
            <div className="mt-2 space-y-4">
              {layoutOptions.map((option) => (
                <RadioGroup.Item
                  key={option.id}
                  value={option.id}
                  className="radio-item flex items-center space-x-3 rounded-lg border p-4"
                >
                  <div className="flex items-center">
                    <RadioGroup.ItemControl className="radio-control mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300">
                      <div className="radio-dot h-2 w-2 rounded-full" />
                    </RadioGroup.ItemControl>
                    <RadioGroup.ItemText>
                      <div>
                        <div className="font-bold">{option.label}</div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </RadioGroup.ItemText>
                  </div>
                  <RadioGroup.ItemHiddenInput />
                </RadioGroup.Item>
              ))}
            </div>
          </RadioGroup.Root>
        </div>

        {selectedLayout === 'complete-home' && (
          <div>
            <div className="mb-2 text-lg font-bold">
              Select Visual Break Style
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {breakVariants.map((breakVar) => (
                <div
                  key={breakVar.id}
                  className={`cursor-pointer rounded-lg border p-2 ${
                    selectedBreak === breakVar.id
                      ? 'border-cyan-600 ring-2 ring-cyan-600 ring-opacity-50'
                      : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedBreak(breakVar.id)}
                >
                  <div className="h-16 overflow-hidden rounded">
                    <VisualBreakPreview
                      bgColour="#ffffff"
                      fillColour="#000000"
                      variant={breakVar.id}
                      height={60}
                    />
                  </div>
                  <div className="mt-1 text-center text-sm font-bold">
                    {breakVar.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => {
            ctx.setPanelMode(nodeId, 'add', 'DEFAULT');
            ctx.notifyNode('root');
          }}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          disabled={isCreating}
        >
          Back
        </button>
        <button
          onClick={handleApply}
          disabled={isCreating || !selectedLayout}
          className={`rounded-md px-6 py-2 text-sm font-bold text-white transition-colors ${
            isCreating || !selectedLayout
              ? 'bg-gray-400'
              : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
        >
          {isCreating ? 'Creating...' : 'Create Layout'}
        </button>
      </div>
    </div>
  );
};

export default PageCreationSpecial;
