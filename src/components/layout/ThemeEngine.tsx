import { useEffect } from 'react';
import { StoreConfig } from '../../types/store';

interface ThemeEngineProps {
  config: StoreConfig;
}

export const ThemeEngine = ({ config }: ThemeEngineProps) => {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--secondary', config.secondaryColor);
    
    // Clear existing theme classes
    root.classList.remove('theme-minimalist', 'theme-playful', 'theme-streetwear', 'theme-sophisticated', 'theme-natural');
    root.classList.add(`theme-${config.theme}`);

    // Set dark mode if sophisticated
    if (config.theme === 'sophisticated') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => {
      root.classList.remove('dark', `theme-${config.theme}`);
    };
  }, [config]);

  return null;
};
