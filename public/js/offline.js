/**
 * HomeoVault - Offline Coordinator Script
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const btnReconnect = document.getElementById('btn-reconnect');

    if (btnReconnect) {
      btnReconnect.addEventListener('click', () => {
        btnReconnect.innerText = 'Checking Connection...';
        btnReconnect.disabled = true;

        // Verify navigator connection status
        if (navigator.onLine) {
          window.location.href = '/dashboard';
        } else {
          // Double check with a quick head fetch request
          fetch('/api/health', { method: 'HEAD', cache: 'no-store' })
            .then(() => {
              window.location.href = '/dashboard';
            })
            .catch(() => {
              // Still offline
              setTimeout(() => {
                btnReconnect.innerText = 'Try Reconnecting';
                btnReconnect.disabled = false;
                alert('Connection still down. Please check your local network router.');
              }, 600);
            });
        }
      });
    }

    // Automatically redirect back to dashboard if online status fires
    window.addEventListener('online', () => {
      window.location.href = '/dashboard';
    });
  });

})();
