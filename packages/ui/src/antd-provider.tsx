'use client';

import { ConfigProvider, type ThemeConfig } from 'antd';
import type React from 'react';

export interface AntdProviderProps {
  children: React.ReactNode;
  theme?: ThemeConfig;
}

const defaultTheme: ThemeConfig = {
  token: {
    // Example custom tokens - can be overridden per app (staff vs public)
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
  components: {
    Button: {
      // Example component override
    },
  },
};

export const AntdProvider: React.FC<AntdProviderProps> = ({ children, theme }) => {
  return <ConfigProvider theme={{ ...defaultTheme, ...theme }}>{children}</ConfigProvider>;
};
