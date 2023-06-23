import { useCachedState } from "@raycast/utils"
import { Channel, Im, ImWithMessages, User, Users } from "../types/types"
import { IMS, USERS } from "../consts/consts"
import { useEffect, useState } from "react"
import { slackClient } from "../api/api"
import { toDictionary } from "kickstart-utils"
import { ConversationsHistoryResponse } from "@slack/web-api"

const isRelevantUser = (user: User) =>
  !user.is_bot && !user.deleted && !(user.id === "USLACKBOT")

const FETCH_USERS_AND_CHANNELS_INTERVAL = 1000 * 60 * 60 * 24

export const useMinFetchInterval = (
  cacheKey: string,
  minIntervalMs: number
) => {
  const [lastFetched, setLastFetched] = useCachedState<number>(
    cacheKey + "-lastFetched"
  )
  const fetched = () => {
    setLastFetched(Date.now())
  }
  return {
    fetched,
    shouldFetch: !lastFetched || Date.now() - lastFetched > minIntervalMs,
  }
}

const useUsers = () => {
  const [users, setUsers] = useCachedState<Users | undefined>(USERS)
  const { fetched, shouldFetch } = useMinFetchInterval(
    USERS,
    FETCH_USERS_AND_CHANNELS_INTERVAL
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!shouldFetch) {
      setIsLoading(false)
      return
    }
    slackClient.users
      .list()
      .then(({ members = [] }) => {
        const filteredUsers = members.filter(isRelevantUser)
        setUsers(toDictionary(filteredUsers, "id"))
        setIsLoading(false)
      })
      .catch((error) => {
        console.log("error", error)
      })
    fetched()
  }, [])

  return { data: users, isLoading }
}

const isRelevantIm = (channel: Channel) =>
  channel.is_im && !channel.is_user_deleted && channel.user

const useIms = () => {
  const [ims, setIms] = useCachedState<Im[] | undefined>("inner-ims")
  const [isLoading, setIsLoading] = useState(true)
  const { fetched, shouldFetch } = useMinFetchInterval(
    "inner-ims",
    FETCH_USERS_AND_CHANNELS_INTERVAL
  )

  useEffect(() => {
    if (!shouldFetch) {
      setIsLoading(false)
      return
    }
    slackClient.conversations
      .list({
        types: "im",
        exclude_archived: true,
      })
      .then(({ channels = [] }) => {
        const imsWithUser = channels.filter(isRelevantIm) as Im[]
        setIms(imsWithUser)
        setIsLoading(false)
      })
    fetched()
  }, [])

  return { data: ims, isLoading }
}

const MESSAGE_PER_CHANNEL = 5

export const useUsersAndIms = () => {
  const { data: users } = useUsers()
  const { data: allIms } = useIms()
  const [ims, setIms] = useCachedState<ImWithMessages[] | undefined>(IMS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (users && allIms) {
      const filteredIms = allIms.filter((im) => users[im.user])

      Promise.all(
        filteredIms.map((im) => {
          return slackClient.conversations.history({
            channel: im.id,
            limit: MESSAGE_PER_CHANNEL,
          })
        })
      ).then((histories: ConversationsHistoryResponse[]) => {
        const imsWithMessages = filteredIms.map((im, index) => {
          return { ...im, messages: histories[index].messages || [] }
        })
        setIms(imsWithMessages)
        setIsLoading(false)
      })
    }
  }, [!!users, !!allIms])

  return { ims, users, isLoading }
}
