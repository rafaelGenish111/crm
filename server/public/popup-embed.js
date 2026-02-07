/**
 * Campaign Popup Embed Script
 * This script loads and displays campaign popups on external websites
 */
(function () {
  'use strict';

  // Get token from query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const scriptTag = document.currentScript || document.querySelector('script[src*="popup-embed.js"]');
  const scriptSrc = scriptTag ? scriptTag.src : '';
  const scriptUrl = new URL(scriptSrc, window.location.origin);
  const token = scriptUrl.searchParams.get('token') || urlParams.get('token');

  if (!token) {
    console.error('Campaign Popup: No token provided');
    return;
  }

  // Get customer/lead IDs from URL params (for targeting)
  const customerId = urlParams.get('customerId');
  const leadId = urlParams.get('leadId');

  // Get API URL from script src
  let apiUrl = '';
  if (scriptSrc) {
    // Extract base URL from script src (everything before /api/popup/embed.js)
    const match = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
    if (match) {
      apiUrl = match[1];
    }
  }
  // Fallback to same origin if script is on same domain
  if (!apiUrl || apiUrl === window.location.origin) {
    apiUrl = window.location.origin;
  }

  // Extract domain from current page
  const domain = window.location.hostname;

  // Check if popup was already shown (using sessionStorage)
  const popupShownKey = `campaign_popup_shown_${token}`;
  if (sessionStorage.getItem(popupShownKey)) {
    return; // Already shown in this session
  }

  // Build query params for popup request
  const popupParams = new URLSearchParams({ domain });
  if (customerId) popupParams.append('customerId', customerId);
  if (leadId) popupParams.append('leadId', leadId);

  // Fetch popup data
  fetch(`${apiUrl}/api/popup/${token}?${popupParams.toString()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Popup not available');
      }
      return response.json();
    })
    .then(data => {
      if (!data.popup) {
        return;
      }

      const popup = data.popup;
      const campaignId = data.campaignId;

      // Record impression
      fetch(`${apiUrl}/api/popup/${token}/impression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, customerId, leadId }),
      }).catch(err => console.error('Failed to record impression:', err));

      // Create popup element
      const popupOverlay = document.createElement('div');
      popupOverlay.id = 'campaign-popup-overlay';
      popupOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      `;

      const popupBox = document.createElement('div');
      popupBox.id = 'campaign-popup-box';
      popupBox.style.cssText = `
        background-color: ${popup.backgroundColor || '#ffffff'};
        color: ${popup.textColor || '#000000'};
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
        animation: popupFadeIn 0.3s ease-out;
      `;

      // Add CSS animation
      if (!document.getElementById('campaign-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'campaign-popup-styles';
        style.textContent = `
          @keyframes popupFadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes popupFadeOut {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.9);
            }
          }
          #campaign-popup-box.closing {
            animation: popupFadeOut 0.2s ease-in forwards;
          }
        `;
        document.head.appendChild(style);
      }

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        background: none;
        border: none;
        font-size: 28px;
        color: ${popup.textColor || '#000000'};
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      `;
      closeBtn.onmouseover = () => closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';
      closeBtn.onclick = () => closePopup();

      // Title
      if (popup.title) {
        const title = document.createElement('h2');
        title.textContent = popup.title;
        title.style.cssText = `
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: bold;
          color: ${popup.textColor || '#000000'};
        `;
        popupBox.appendChild(title);
      }

      // Image
      if (popup.imageUrl) {
        const img = document.createElement('img');
        img.src = popup.imageUrl;
        img.style.cssText = `
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 16px;
        `;
        img.onerror = () => img.style.display = 'none';
        popupBox.appendChild(img);
      }

      // Message
      if (popup.message) {
        const message = document.createElement('p');
        message.textContent = popup.message;
        message.style.cssText = `
          margin: 0 0 24px 0;
          font-size: 16px;
          line-height: 1.5;
          color: ${popup.textColor || '#000000'};
        `;
        popupBox.appendChild(message);
      }

      // CTA Button
      if (popup.ctaUrl && popup.ctaText) {
        const ctaBtn = document.createElement('a');
        ctaBtn.href = popup.ctaUrl;
        ctaBtn.textContent = popup.ctaText;
        ctaBtn.target = '_blank';
        ctaBtn.rel = 'noopener noreferrer';
        ctaBtn.style.cssText = `
          display: inline-block;
          background-color: ${popup.buttonColor || '#007bff'};
          color: ${popup.buttonTextColor || '#ffffff'};
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
          cursor: pointer;
        `;
        ctaBtn.onmouseover = () => ctaBtn.style.opacity = '0.9';
        ctaBtn.onmouseout = () => ctaBtn.style.opacity = '1';
        ctaBtn.onclick = () => {
          // Record click
          fetch(`${apiUrl}/api/popup/${token}/click`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ domain, customerId, leadId }),
          }).catch(err => console.error('Failed to record click:', err));
          closePopup();
        };
        popupBox.appendChild(ctaBtn);
      }

      popupBox.appendChild(closeBtn);
      popupOverlay.appendChild(popupBox);
      document.body.appendChild(popupOverlay);

      // Close on overlay click
      popupOverlay.onclick = (e) => {
        if (e.target === popupOverlay) {
          closePopup();
        }
      };

      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      function closePopup() {
        popupBox.classList.add('closing');
        setTimeout(() => {
          if (popupOverlay.parentNode) {
            popupOverlay.parentNode.removeChild(popupOverlay);
          }
          sessionStorage.setItem(popupShownKey, 'true');
        }, 200);
      }

      // Show popup after delay
      setTimeout(() => {
        popupOverlay.style.display = 'flex';
      }, popup.delay || 3000);
    })
    .catch(error => {
      // Silently fail - don't show errors to end users
      console.debug('Campaign Popup:', error.message);
    });
})();
