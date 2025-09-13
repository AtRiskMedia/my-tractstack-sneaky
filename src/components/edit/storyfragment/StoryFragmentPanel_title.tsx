import { useState, useEffect, type ChangeEvent } from 'react';
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import { cloneDeep, titleToSlug, findUniqueSlug } from '@/utils/helpers';
import { getCtx } from '@/stores/nodes';
import { fullContentMapStore } from '@/stores/storykeep';
import {
  StoryFragmentMode,
  type StoryFragmentNode,
} from '@/types/compositorTypes';

interface StoryFragmentOpenGraphPanelProps {
  nodeId: string;
  setMode?: (mode: StoryFragmentMode) => void;
}

const StoryFragmentOpenGraphPanel = ({
  nodeId,
  setMode,
}: StoryFragmentOpenGraphPanelProps) => {
  const [title, setTitle] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [warning, setWarning] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const ctx = getCtx();
  const allNodes = ctx.allNodes.get();
  const storyfragmentNode = allNodes.get(nodeId) as StoryFragmentNode;
  if (!storyfragmentNode) return null;

  useEffect(() => {
    setTitle(storyfragmentNode.title);
    setCharCount(storyfragmentNode.title.length);
  }, [storyfragmentNode.title]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle.length <= 70) {
      // Prevent more than 70 chars
      setTitle(newTitle);
      setCharCount(newTitle.length);
      setIsValid(newTitle.length >= 35 && newTitle.length <= 60);
      setWarning(newTitle.length > 60 && newTitle.length <= 70);
    }
  };

  const handleTitleBlur = () => {
    if (title.length >= 5) {
      // Only update if meets minimum length
      const ctx = getCtx();
      const existingSlugs = fullContentMapStore
        .get()
        .filter((item) => ['Pane', 'StoryFragment'].includes(item.type))
        .map((item) => item.slug);
      const newSlug =
        storyfragmentNode.slug === ``
          ? findUniqueSlug(titleToSlug(title), existingSlugs)
          : null;
      const updatedNode = cloneDeep({
        ...storyfragmentNode,
        title,
        ...(newSlug ? { slug: newSlug } : {}),
        isChanged: true,
      });
      ctx.modifyNodes([updatedNode]);
    }
  };

  return (
    <div className="group mb-4 w-full rounded-b-md bg-white px-1.5 py-6">
      <div className="px-3.5">
        <div className="mb-4 flex justify-between">
          <h3 className="text-lg font-bold">Page Title</h3>
          {setMode && (
            <button
              onClick={() => setMode && setMode(StoryFragmentMode.DEFAULT)}
              className="text-myblue hover:text-black"
            >
              ← Close Panel
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className={`w-full rounded-md border px-2 py-1 pr-16 ${
              charCount < 5
                ? 'border-red-500 bg-red-50'
                : isValid
                  ? 'border-green-500 bg-green-50'
                  : warning
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-300'
            }`}
            placeholder="Enter story fragment title (50-60 characters recommended)"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {charCount < 5 ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <CheckIcon className="h-5 w-5 text-green-500" />
            ) : warning ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            ) : null}
            <span
              className={`text-sm ${
                charCount < 5
                  ? 'text-red-500'
                  : isValid
                    ? 'text-green-500'
                    : warning
                      ? 'text-yellow-500'
                      : 'text-gray-500'
              }`}
            >
              {charCount}/70
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleTitleBlur}
            disabled={title.length < 5}
            className={`rounded bg-cyan-700 px-3 py-1 text-sm text-white transition-colors hover:bg-cyan-800 ${
              title !== storyfragmentNode.title ? 'inline-flex' : 'hidden'
            } items-center ${title.length < 5 ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <CheckIcon className="mr-1 h-4 w-4" />
            Save
          </button>
          <span
            className={`text-sm ${title !== storyfragmentNode.title ? 'inline' : 'hidden'} text-gray-500`}
          >
            or press Enter
          </span>
        </div>
        <div className="mt-4 text-lg">
          <div className="text-gray-600">
            Write a clear, descriptive title that accurately represents your
            page content.
            <ul className="ml-4 mt-1">
              <li>
                <CheckIcon className="inline h-4 w-4" /> Include relevant
                keywords
              </li>
              <li>
                <CheckIcon className="inline h-4 w-4" /> Avoid unnecessary words
                like "welcome to" or "the"
              </li>
              <li>
                <CheckIcon className="inline h-4 w-4" /> Unique titles across
                your website
              </li>
            </ul>
          </div>
          <div className="py-4">
            {charCount < 5 && (
              <span className="text-red-500">
                Title must be at least 5 characters
              </span>
            )}
            {charCount >= 5 && charCount < 50 && (
              <span className="text-gray-500">
                Add {50 - charCount} more characters for optimal length
              </span>
            )}
            {` `}
            {warning && (
              <span className="text-yellow-500">Title is getting long</span>
            )}
            {isValid && (
              <span className="text-green-500">Perfect title length!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryFragmentOpenGraphPanel;
