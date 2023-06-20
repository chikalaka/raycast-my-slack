import { Action, ActionPanel, Image, List, popToRoot } from "@raycast/api"
import { useState } from "react"
import { Message, Users } from "../types/types"
import { formatChatMarkdown } from "../utils/utils"

type ChatProps = {
  users: Users
  messages: Message[]
  userIconAndTitle: { icon: { source: any; mask: Image.Mask }; title: any }
  sendMessage: (text: string) => void
}

export default function Chat({
  users,
  messages,
  userIconAndTitle,
  sendMessage,
}: ChatProps) {
  const [typedMessage, setTypedMessage] = useState<string>("")
  return (
    <List
      isShowingDetail
      searchBarPlaceholder="Type here your message"
      onSearchTextChange={setTypedMessage}
      searchText={typedMessage}
    >
      <List.Item
        {...userIconAndTitle}
        detail={
          <List.Item.Detail markdown={formatChatMarkdown(messages, users)} />
        }
        actions={
          <ActionPanel>
            <Action
              title={"Send Message"}
              onAction={() => {
                if (typedMessage.trim() !== "") {
                  sendMessage(typedMessage)
                  setTypedMessage("")
                  popToRoot()
                }
              }}
            />
          </ActionPanel>
        }
      />
    </List>
  )
}
