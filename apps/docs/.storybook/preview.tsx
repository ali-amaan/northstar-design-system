import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import '@northstar-js/tokens/tokens.css';
import '@northstar-js/fonts/fonts.css';
import '@northstar-js/react/styles.css';
import '@northstar-js/react/effects.css';
import '@northstar-js/react/backdrops.css';
import { NorthstarProvider, Toaster, type Density } from '@northstar-js/react';

const withNorthstar: Decorator = (Story, context) => {
  const theme = (context.globals.theme ?? 'night') as 'night' | 'day';
  const density = (context.globals.density ?? 'default') as Density;
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = 'var(--ns-color-ground)';
  }, [theme]);
  return (
    <NorthstarProvider theme={theme} density={density} style={{ padding: 24, minHeight: '100vh' }}>
      <Story />
      <Toaster />
    </NorthstarProvider>
  );
};

const preview: Preview = {
  decorators: [withNorthstar],
  globalTypes: {
    theme: {
      description: 'Northstar theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: [{ value: 'night', title: 'Night' }, { value: 'day', title: 'Day' }], dynamicTitle: true },
    },
    density: {
      description: 'Density',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [{ value: 'compact', title: 'Compact' }, { value: 'default', title: 'Default' }, { value: 'comfortable', title: 'Comfortable' }],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'night', density: 'default' },
  parameters: { layout: 'fullscreen', controls: { expanded: true } },
};

export default preview;
