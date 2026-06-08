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
createRoot(rootElement).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <AntdProvider>
        <App />
      </AntdProvider>
    </ApolloProvider>
  </StrictMode>
);
