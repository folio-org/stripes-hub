// This file is only used in Vite builds, not in Jest tests
export const messages = {};

// Dynamically import all translation JSON files from the translations folder
const translationModules = import.meta.glob('../translations/stripes-hub/*.json', { eager: true });

Object.entries(translationModules).forEach(([path, module]) => {
  // Extract filename from path (e.g., '../translations/stripes-hub/en_US.json' -> 'en_US')
  const filename = path.split('/').pop().replaceAll('.json', '');
  // Convert filename to locale format (e.g., 'en_US' -> 'en-US')
  const locale = filename.replaceAll(/_/g, '-');
  messages[locale] = module.default;
});
