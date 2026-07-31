declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export const tg = window.Telegram?.WebApp;

export function initTelegramApp() {
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }
      tg.setHeaderColor?.('#0f172a');
      tg.setBackgroundColor?.('#0f172a');
    } catch (e) {
      console.warn('Telegram SDK header color/swipe set failed', e);
    }
  }
}

export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  } else {
    // Vibration API fallback for browsers
    if ('vibrate' in navigator) {
      navigator.vibrate(style === 'heavy' ? 80 : style === 'medium' ? 40 : 20);
    }
  }
}

export function triggerNotificationHaptic(type: 'error' | 'success' | 'warning' = 'success') {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type);
  }
}

export function getTelegramUserData() {
  if (tg?.initDataUnsafe?.user) {
    return {
      id: tg.initDataUnsafe.user.id,
      first_name: tg.initDataUnsafe.user.first_name,
      last_name: tg.initDataUnsafe.user.last_name || '',
      username: tg.initDataUnsafe.user.username || '',
      photo_url: tg.initDataUnsafe.user.photo_url || null,
    };
  }
  return {
    id: 1001,
    first_name: 'Гость',
    last_name: '',
    username: '',
    photo_url: null,
  };
}
