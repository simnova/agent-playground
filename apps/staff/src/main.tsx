import { ApolloProvider } from '@apollo/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { client } from './lib/apollo-client.ts';
import './style.css';

// Ant Design as primary UI component library
import 'antd/dist/reset.css';
import { AntdProvider } from '@repo/ui/antd-provider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Staff theme: blue primary (per AntdProvider + UI conventions; public uses green for customer-facing)
const staffBlueTheme = {
  token: {
    colorPrimary: '#1677ff', // Classic antd blue for internal power tools / config UIs
    borderRadius: 6,
  },
};

createRoot(rootElement).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <AntdProvider theme={staffBlueTheme}>
        <App />
      </AntdProvider>
    </ApolloProvider>
  </StrictMode>
);
