// knip-ignore
export interface Message {
  id: string;
  text: string;
}

// knip-ignore
export interface MessagesStore {
  getAll: () => Message[];
  add: (text: string) => Message;
}

export interface GraphQLContext {
  messagesStore: MessagesStore;
}
