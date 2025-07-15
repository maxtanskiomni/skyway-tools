import { StateManager } from './stateManager';

// Default image to use when no specific image is provided
const DEFAULT_OG_IMAGE = '/logo.png';

/**
 * Debug function to verify meta tags are set correctly
 */
export const debugMetaTags = () => {
  const metaTags = {
    'og:image': document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    'og:description': document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    'apple-touch-icon': document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')
  };
  console.log('Current Meta Tags:', metaTags);
  return metaTags;
};

/**
 * Sets the Open Graph image for the current page
 * @param {string} imageUrl - The URL of the image to use for Open Graph
 * @param {string} description - Optional description for the page
 */
export const setPageMeta = (imageUrl, description = '') => {
  // Update the meta tags
  const updateMetaTag = (property, content) => {
    let element = document.querySelector(`meta[property="${property}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('property', property);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Update the apple touch icon
  const updateAppleTouchIcon = (href) => {
    let element = document.querySelector('link[rel="apple-touch-icon"]');
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(element);
    }
    element.setAttribute('href', href);
  };

  // Set the Open Graph image
  const ogImage = imageUrl || DEFAULT_OG_IMAGE;
  updateMetaTag('og:image', ogImage);
  updateAppleTouchIcon(ogImage);

  // Set description if provided
  if (description) {
    updateMetaTag('og:description', description);
  }

  // Store the current image in StateManager for reference
  StateManager.currentOgImage = ogImage;

  // Debug output
  if (process.env.NODE_ENV === 'development') {
    debugMetaTags();
  }
};

/**
 * Resets the Open Graph image to the default
 */
export const resetPageMeta = () => {
  setPageMeta(DEFAULT_OG_IMAGE);
}; 