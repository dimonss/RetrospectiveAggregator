import { useEffect } from 'react';

export function useTelegramAuth({
  containerId,
  botName,
  onSuccess,
  disabled = false,
}: {
  containerId: string;
  botName: string;
  onSuccess: (user: any) => void;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (disabled || !botName) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    (window as any).__onTelegramAuth = (user: any) => {
      onSuccess(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', '__onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      delete (window as any).__onTelegramAuth;
    };
  }, [containerId, botName, onSuccess, disabled]);
}
