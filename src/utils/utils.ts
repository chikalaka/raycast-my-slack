import { ImWithMessages, Message, User, Users } from "../types/types"
import { slackClient } from "../api/api"
import { Image, showToast, Toast, open, closeMainWindow } from "@raycast/api"
import Mask = Image.Mask
import Style = Toast.Style
import { runAppleScript } from "@raycast/utils"

const formatMessage = (message?: Message, user?: User) => {
  if (!message) return ""

  const userText = user ? `**${user.real_name}**` : ""
  const messageText = `\n\n${message.text}`

  return userText + messageText
}

export const formatChatMarkdown = (
  messages: Message[],
  users: Users
): string => {
  if (!messages) return ""

  let lastUserId = ""

  const addUserAndFormatMessage = (message: Message) => {
    const user = (message.user && users[message.user]) || {}
    const userId = user.id

    if (lastUserId === userId) return formatMessage(message)
    lastUserId = userId || ""
    return formatMessage(message, user)
  }

  return messages
    .filter((m) => m.text)
    .map(addUserAndFormatMessage)
    .join("\n\n---\n\n")
}

const MESSAGE_SUCCESS = "Message sent!"

export const sendMessageToChannel = (channelId: string) => (text: string) => {
  slackClient.chat
    .postMessage({
      channel: channelId,
      text,
    })
    .then(() => {
      closeMainWindow().then(() =>
        showToast({
          title: MESSAGE_SUCCESS,
        })
      )
    })
  showToast({ title: "Sending message", style: Style.Animated })
}

export const getUserIconAndTitle = (user: User) => {
  return {
    title: user.real_name || "Unknown User",
    icon: {
      source: user.profile?.image_24 || "unknown-user.png",
      mask: Mask.Circle,
    },
  }
}

const getLastMessageTs = (im: ImWithMessages) =>
  Number(im.messages?.[0]?.ts || 0)

const sortImWithMessages = (a: ImWithMessages, b: ImWithMessages) =>
  getLastMessageTs(b) - getLastMessageTs(a)

export const getSortedImsByLastMessage = (ims?: ImWithMessages[]) =>
  [...(ims || [])].sort(sortImWithMessages)

export const openChat = (workspaceId: string, userId: string) => {
  open(`slack://user?team=${workspaceId}&id=${userId}`)
  runAppleScript(
    buildScriptEnsuringSlackIsRunning(`
        tell application "System Events" to tell process "Slack" to key code 47 using {command down}
      `)
  )
  closeMainWindow()
}

export const openUnreadMessages = () => {
  runAppleScript(
    buildScriptEnsuringSlackIsRunning(`
      tell application "System Events" to tell process "Slack" to keystroke "A" using {command down, shift down}
    `)
  )
}

export const buildScriptEnsuringSlackIsRunning = (
  commandsToRunAfterSlackIsRunning: string
): string => {
  return `
    tell application "Slack"
      if not application "Slack" is running then
        activate
        set _maxOpenWaitTimeInSeconds to 5
        set _openCounter to 0
        repeat until application "Slack" is running
          delay 0.5
          set _openCounter to _openCounter + 0.5
          if _openCounter > _maxOpenWaitTimeInSeconds then exit repeat
        end repeat

        delay 6

        # Exit 'Set yourself to active?' window
        activate
        tell application "System Events"
          key code 53
        end tell
      end if
      activate
      ${commandsToRunAfterSlackIsRunning}
    end tell`
}
