import { useMutation, useQuery } from '@apollo/client';
import { message as antdMessage, Button, Card, Form, Input, List, Space, Typography } from 'antd';
import { gql } from './gql/gql';

const GET_MESSAGES = gql(`
  query GetMessages {
    messages {
      id
      text
    }
    hello
  }
`);

const ADD_MESSAGE = gql(`
  mutation AddMessage($text: String!) {
    addMessage(text: $text) {
      id
      text
    }
  }
`);

function App() {
  const { data, loading, error, refetch } = useQuery(GET_MESSAGES);

  const [addMessage, { loading: adding }] = useMutation(ADD_MESSAGE, {
    onCompleted: () => {
      refetch();
    },
  });

  const [form] = Form.useForm();

  const onFinish = (values: { text: string }) => {
    if (!values.text?.trim()) return;
    addMessage({ variables: { text: values.text.trim() } });
    form.resetFields();
  };

  const handleRefresh = () => {
    refetch();
    antdMessage.info('Refreshed messages');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <div className="max-w-3xl mx-auto">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Title level={2} style={{ color: '#fff', margin: 0 }}>
                Public Portal
              </Typography.Title>
              <Typography.Text type="secondary">Vite + React + Apollo Client → Shared Hono + Apollo Backend (Ant Design)</Typography.Text>
            </div>
            <div style={{ fontSize: 12, padding: '4px 12px', background: '#18181b', border: '1px solid #27272a', borderRadius: 999 }}>Public UI (Vite + antd)</div>
          </div>

          <Card>
            <Typography.Text strong>Server says: </Typography.Text>
            <Typography.Text style={{ color: '#52c41a' }}>{loading ? '…' : (data?.hello ?? '—')}</Typography.Text>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Endpoint: {import.meta.env['VITE_GRAPHQL_URL'] || 'https://api.localhost/graphql'}</div>
          </Card>

          <Card
            title="Messages"
            extra={
              <Button onClick={handleRefresh} loading={loading} size="small">
                Refresh
              </Button>
            }
          >
            {error && (
              <Card style={{ background: '#450a0a', borderColor: '#7f1d1d', marginBottom: 16 }}>
                <Typography.Text type="danger">Error: {error.message}. Is the API server running?</Typography.Text>
              </Card>
            )}

            <List
              loading={loading && !data}
              dataSource={data?.messages || []}
              locale={{ emptyText: 'No messages yet. Add one below!' }}
              renderItem={(msg) => (
                <List.Item key={msg.id}>
                  <List.Item.Meta avatar={<span style={{ color: '#52c41a', fontFamily: 'monospace' }}>#{msg.id}</span>} title={msg.text} />
                </List.Item>
              )}
            />

            <Form form={form} onFinish={onFinish} layout="inline" style={{ marginTop: 16 }}>
              <Form.Item name="text" rules={[{ required: true, message: 'Please enter a message' }]} style={{ flex: 1 }}>
                <Input placeholder="Type a new message..." disabled={adding} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={adding}>
                  Send
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Typography.Text type="secondary" style={{ fontSize: 10, textAlign: 'center', display: 'block' }}>
            Public UI (Vite + Apollo Client + Ant Design). Connects to the shared backend (api). Companion to the staff UI; both use the same GraphQL backend.
          </Typography.Text>
        </Space>
      </div>
    </div>
  );
}

export default App;
