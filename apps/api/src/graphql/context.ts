export interface Message {
  id: string;
  text: string;
}

export interface MessagesStore {
  getAll: () => Message[];
  add: (text: string) => Message;
}

export interface GraphQLContext {
  messagesStore: MessagesStore;
}
