import envCi, {CodefreshEnv} from 'env-ci'
import {getLogger} from '../utils/logger'
import {ValidState} from '../utils/types'

// Using this type as this has the most supported fields
const env = envCi() as CodefreshEnv
const defaultDeploy = 'Unknown'

export function getBranchName(): string | undefined {
  const branchName: string = env.branch

  getLogger().debug(`BranchName: ${branchName}`)

  return branchName
}

export function getState(): ValidState {
  // @ts-expect-error cast type
  const state: 'success' | 'failure' | ValidState =
    process.env.BUILD_STATE ||
    'successful'

  if (state === 'success') {
    return 'successful'
  }

  if (state === 'failure') {
    return 'failed'
  }

  return state
}

export function  getArgoCD(): {
  displayName: string
  url: string
} {
  const deployUrl =
    process.env.argo_cd_sync_CF_OUTPUT_URL ||
    defaultDeploy
  const deployName = deployUrl.split('/')[7]

  getLogger().debug(`Deployment : ${deployName}`)

  return {
    displayName: deployName,
    url: deployUrl,
  }

}

/**
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push
 * @returns will give latest commit message if ̉push event
 */
export async function getCommitMessage(): Promise<string | undefined> {
  const commitMessage =
    process.env.CF_COMMIT_MESSAGE ||
    undefined

  getLogger().debug(`CommitMessage: ${commitMessage}`)

  return commitMessage
}

export async function getIssueKeys(): Promise<string[]> {
  const branchName = getBranchName()
  const commitMessage = await getCommitMessage()

  const fromInput = process.env.JIRA_ISSUE_ID?.match(/(\w+)-(\d+)/g) ?? []

  const fromBranch = branchName?.match(/(\w+)-(\d+)/g) ?? []

  const fromCommit = commitMessage?.match(/(\w+)-(\d+)/g) ?? []

  const issueKeys = [...fromInput, ...fromBranch, ...fromCommit].filter(
    (value, index, array) => {
      // Deduplicate and remove nill values
      return value && array.indexOf(value) === index
    },
  )

  if (!issueKeys.length && process.env.JIRA_DEFAULT_TEST_ISSUE) {
    issueKeys.push(process.env.JIRA_DEFAULT_TEST_ISSUE)
  }

  getLogger().debug(`IssueKeys: "${issueKeys}"`)

  return issueKeys
}
