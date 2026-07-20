import { useEffect } from 'react';

export function useGoogleAuth({
  containerId,
  clientId,
  onSuccess,
  disabled,
}: {
  containerId: string;
  clientId: string | undefined;
  onSuccess: (idToken: string) => void;
  disabled: boolean;
}) {
  useEffect(() => {
    if (disabled || !clientId) return;

    const renderButton = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            onSuccess(response.credential);
          }
        },
      });

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: 280,
        });
      }
    };

    if ((window as any).google?.accounts?.id) {
      renderButton();
    } else {
      const existingScript = document.getElementById('google-jssdk');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderButton;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderButton);
        return () => existingScript.removeEventListener('load', renderButton);
      }
    }
  }, [containerId, clientId, onSuccess, disabled]);
}
