import { Action, ActionPanel, List, useNavigation } from "@raycast/api"
import Chat from "./views/Chat"
import {
  formatChatMarkdown,
  getSortedImsByLastMessage,
  getUserIconAndTitle,
  openChat,
  openGeneralSearch,
  openSearchConversation,
  openUnreadMessages,
  sendMessageToChannel,
} from "./utils/utils"
import { useUsersAndIms } from "./hooks/hooks"
import { User } from "./types/types"

export default function Command() {
  const { ims, users, isLoading } = useUsersAndIms()
  const { push } = useNavigation()

  const sortedIms = getSortedImsByLastMessage(ims)

  return (
    <List isLoading={isLoading} isShowingDetail>
      <List.Section title={"Chat with"}>
        {sortedIms?.map((im) => {
          const imUser: User = users?.[im.user] || {}
          const userIconAndTitle = getUserIconAndTitle(imUser)
          const reversedMessages = im.messages ? [...im.messages].reverse() : []

          const openChatInSlackActionProps: React.ComponentProps<
            typeof Action
          > = {
            shortcut: { modifiers: ["cmd"], key: "enter" },
            title: "Open in Slack",
            onAction: () => {
              if (imUser.team_id && imUser.id)
                openChat(imUser.team_id, imUser.id)
            },
            icon: userIconAndTitle.icon,
          }

          return (
            <List.Item
              key={im.id}
              {...userIconAndTitle}
              actions={
                <ActionPanel>
                  <Action
                    title="Enter Chat"
                    icon={userIconAndTitle.icon}
                    onAction={() =>
                      push(
                        <Chat
                          sendMessage={sendMessageToChannel(im.id)}
                          users={users || {}}
                          messages={reversedMessages}
                          userIconAndTitle={userIconAndTitle}
                          openChatInSlackActionProps={
                            openChatInSlackActionProps
                          }
                        />
                      )
                    }
                  />
                  <Action {...openChatInSlackActionProps} />
                  <ActionPanel.Section>
                    <Action
                      icon={{ source: "slack.png" }}
                      shortcut={{ modifiers: ["cmd"], key: "s" }}
                      title="Search a Conversation"
                      onAction={() => {
                        openSearchConversation()
                      }}
                    />
                    <Action
                      icon={{ source: "slack.png" }}
                      shortcut={{ modifiers: ["cmd"], key: "g" }}
                      title="General Search"
                      onAction={() => {
                        openGeneralSearch()
                      }}
                    />
                    <Action
                      icon={{ source: "slack.png" }}
                      shortcut={{ modifiers: ["cmd"], key: "u" }}
                      title="Open All Unread Messages"
                      onAction={() => {
                        openUnreadMessages()
                      }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
              detail={
                <List.Item.Detail
                  markdown={formatChatMarkdown(reversedMessages, users || {})}
                />
              }
            />
          )
        })}
      </List.Section>
    </List>
  )
}
