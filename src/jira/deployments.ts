import {Jira} from './api'
import {getLogger} from '../utils/logger'
import {ReturnTypeResolved, ValidState} from '../utils/types'
import type {processEnvironmentTpe} from '../utils/validator'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function sendDeploymentInfo(
  jira: Jira,
  {
    name,
    commit,
    state,
    issueKeys,
    buildUrl,
    pipelineId,
    buildNumber,
    environment,
    argoCD,
  }: {
    name: string
    commit: string
    state: ValidState
    issueKeys: string[]
    buildUrl: string
    pipelineId: string
    buildNumber: number
    environment: {
      displayName: string
      type: ReturnTypeResolved<typeof processEnvironmentTpe>
    }
    argoCD: {
        displayName: string
        url: string
    }
  },
) {
  const now = Date.now()
  const logger = getLogger()
  var url = buildUrl
  var displayName = name

  if (argoCD.url != 'Unknown') {
    url = argoCD.url
    displayName = argoCD.displayName
  }

  if (!issueKeys.length) {
    logger.info('No issue keys found to send "deployment" event for')
    return
  }

  logger.info('Sending "deployment" event')
  const response = await jira.submitDeployments(
    {},
    {
      deployments: [
        {
          schemaVersion: '1.0',
          pipeline: {
            id: pipelineId,
            url: url,
            displayName: displayName,
          },
          deploymentSequenceNumber: buildNumber,
          environment: {
            ...environment,
            id: `${environment.displayName.toLowerCase()}-${pipelineId}`,
          },
          updateSequenceNumber: now,
          displayName: displayName,
          description: `${displayName} triggered for commit ${commit}`,
          url: url,
          state,
          lastUpdated: new Date(now).toISOString(),
          issueKeys,
        },
      ],
    },
  )
  logger.debug(`Deployment Response:\n${JSON.stringify(response, null, 2)}`)

  if (response.rejectedDeployments?.length) {
    throw new Error(
      `Invalid deployment generated:\n ${JSON.stringify(
        response.rejectedDeployments,
        null,
        2,
      )}`,
    )
  }
  return response.acceptedDeployments?.[0]
}
