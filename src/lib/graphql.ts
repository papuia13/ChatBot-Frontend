import { gql } from 'urql'

export const SUB_CHATS = gql/* GraphQL */ `
  subscription Chats {
    chats(order_by: {updated_at: desc}) {
      id
      title
      updated_at
    }
  }
`

export const SUB_MESSAGES = gql/* GraphQL */ `
  subscription Messages($chat_id: uuid!) {
    messages(where: {chat_id: {_eq: $chat_id}}, order_by: {created_at: asc}) {
      id
      role
      content
      created_at
    }
  }
`

export const MUT_CREATE_CHAT = gql/* GraphQL */ `
  mutation CreateChat($title: String!) {
    insert_chats_one(object: { title: $title }) {
      id
      title
      created_at
    }
  }
`

export const MUT_INSERT_USER_MESSAGE = gql/* GraphQL */ `
  mutation InsertUserMessage($chat_id: uuid!, $content: String!) {
    insert_messages_one(object: { chat_id: $chat_id, role: "user", content: $content }) {
      id
    }
  }
`

export const MUT_SEND_MESSAGE = gql/* GraphQL */ `
  mutation SendMessage($chat_id: uuid!, $content: String!) {
    sendMessage(input: { chat_id: $chat_id, content: $content }) {
      id
      chat_id
      role
      content
      created_at
    }
  }
`
