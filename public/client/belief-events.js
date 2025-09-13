const VERBOSE = false;

// This function now contains all essential one-time and recurring HTMX setup.
function configureHtmx() {
  if (!window.htmx) return;

  if (!window.HTMX_CONFIGURED) {
    window.htmx.config.selfRequestsOnly = false;
    window.HTMX_CONFIGURED = true;
  }

  window.htmx.on(document.body, 'htmx:configRequest', function (evt) {
    const config = window.TRACTSTACK_CONFIG;
    if (!config || !config.sessionId) return; // Check for config and session ID

    if (evt.detail.path && evt.detail.path.startsWith('/api/v1/')) {
      evt.detail.path = config.backendUrl + evt.detail.path;
    }

    // MODIFIED: Use session ID from the global config object
    const sessionId = config.sessionId;
    evt.detail.headers['X-Tenant-ID'] = config.tenantId;
    evt.detail.headers['X-StoryFragment-ID'] = config.storyfragmentId;
    if (sessionId) {
      evt.detail.headers['X-TractStack-Session-ID'] = sessionId;
    }
  });
}

const pageBeliefs = {};
let activeStoryfragmentId = null;

function waitForSessionReady() {
  return new Promise((resolve) => {
    // This event is fired by sse.ts after the handshake is complete.
    if (window.TRACTSTACK_CONFIG?.session?.isReady) {
      resolve();
    } else {
      window.addEventListener('tractstack:session-ready', () => resolve(), {
        once: true,
      });
    }
  });
}

function initializeBeliefs() {
  if (window.BELIEF_INITIALIZED) {
    return;
  }
  window.BELIEF_INITIALIZED = true;

  if (VERBOSE)
    console.log(
      '🔧 BELIEF: First-time initialization of belief handlers and HTMX config.'
    );

  configureHtmx(); // Run config on initial load.

  document.addEventListener('change', function (event) {
    const target = event.target;
    if (
      target.matches &&
      (target.matches('select[data-belief-id]') ||
        target.matches('input[type="checkbox"][data-belief-id]'))
    ) {
      handleBeliefChange(target);
    }
  });
}

async function handleBeliefChange(element) {
  const beliefId = element.getAttribute('data-belief-id');
  const beliefType = element.getAttribute('data-belief-type');
  const paneId = element.getAttribute('data-pane-id');

  if (!beliefId || !beliefType) {
    if (VERBOSE)
      console.error('🔴 BELIEF: Missing required attributes on', element.id);
    return;
  }

  let beliefValue;
  if (element.type === 'checkbox') {
    beliefValue = element.checked ? 'BELIEVES_YES' : 'BELIEVES_NO';
  } else {
    beliefValue = element.value;
  }

  if (VERBOSE)
    console.log('🔄 BELIEF: Widget changed', {
      beliefId,
      beliefType,
      beliefValue,
      paneId,
    });

  trackBeliefState(beliefId, beliefValue);

  // Pass the current page's beliefs to the backend
  await sendBeliefUpdate({
    beliefId,
    beliefType,
    beliefValue,
    paneId: paneId || '',
  });
}

async function sendBeliefUpdate(data) {
  await waitForSessionReady();

  try {
    const config = window.TRACTSTACK_CONFIG;
    if (!config || !config.sessionId) return; // Check for config and session ID

    if (VERBOSE)
      console.log('🚨 FRONTEND DEBUG: Sending belief update with headers:', {
        'X-StoryFragment-ID': config.storyfragmentId,
        beliefData: data,
        currentSSEContext: 'check sse.ts logs',
      });

    const sessionId = config.sessionId;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Tenant-ID': config.tenantId,
      'X-StoryFragment-ID': config.storyfragmentId,
      'X-TractStack-Session-ID': sessionId,
    };

    if (VERBOSE)
      console.log('📡 BELIEF: Session ready, sending update.', { data });

    const response = await fetch(`${config.backendUrl}/api/v1/state`, {
      method: 'POST',
      headers: headers,
      body: new URLSearchParams(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    if (VERBOSE)
      console.error('🔴 BELIEF: Update failed', {
        error: errorMessage,
        beliefId: data.beliefId,
      });
  }
}

function trackBeliefState(beliefId, beliefValue) {
  if (!activeStoryfragmentId) return;

  if (!pageBeliefs[activeStoryfragmentId]) {
    pageBeliefs[activeStoryfragmentId] = {};
  }
  pageBeliefs[activeStoryfragmentId][beliefId] = beliefValue;
  if (VERBOSE)
    console.log(`📝 BELIEF: Tracked state for page ${activeStoryfragmentId}`, {
      ...pageBeliefs[activeStoryfragmentId],
    });
}

function setActiveStoryFragment() {
  if (window.TRACTSTACK_CONFIG?.storyfragmentId) {
    activeStoryfragmentId = window.TRACTSTACK_CONFIG.storyfragmentId;
    if (VERBOSE)
      console.log(
        `📖 BELIEF: Active story fragment set to ${activeStoryfragmentId}`
      );
    // Ensure a state object exists for the newly active page
    if (!pageBeliefs[activeStoryfragmentId]) {
      pageBeliefs[activeStoryfragmentId] = {};
    }
  }
}

initializeBeliefs();

document.addEventListener('astro:page-load', () => {
  configureHtmx();
  setActiveStoryFragment();
});

// Also set the active story on the very first page load.
document.addEventListener('DOMContentLoaded', setActiveStoryFragment);

if (VERBOSE)
  console.log('🔧 BELIEF: Belief events module loaded and is persistent.');
