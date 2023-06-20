import {
  ConversationsHistoryResponse,
  ConversationsListResponse,
  UsersListResponse,
} from "@slack/web-api"

export type User = Required<UsersListResponse>["members"][number]
export type Users = Record<string, User>
export type Message = Required<ConversationsHistoryResponse>["messages"][number]
export type Channel = Required<ConversationsListResponse>["channels"][number]
export type Im = Omit<Channel, "user" | "is"> & { user: string; id: string }
export type ImWithMessages = Im & { messages?: Message[] }
