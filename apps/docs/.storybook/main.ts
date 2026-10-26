import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  viteFinal(config) {
    // "use client" banners are for React Server Component bundlers; Vite ignores them.
    const onwarn = config.build?.rollupOptions?.onwarn;
    config.build = {
      ...config.build,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        ...config.build?.rollupOptions,
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          if (onwarn) onwarn(warning, warn);
          else warn(warning);
        },
      },
    };
    return config;
  },
};

export default config;
