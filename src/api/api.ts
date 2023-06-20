import { getPreferenceValues } from "@raycast/api"
import { WebClient } from "@slack/web-api"

const { slackApiToken } = getPreferenceValues()

export const slackClient = new WebClient(slackApiToken)
