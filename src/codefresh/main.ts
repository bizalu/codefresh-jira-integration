/* eslint-disable no-case-declarations */
import envCi, {CodefreshEnv} from 'env-ci'
import createJiraAPI from '../jira/api'
import {sendBuildInfo} from '../jira/builds'
import {sendDeploymentInfo} from '../jira/deployments'
import {getLogger, setLogger} from '../utils/logger'
import {getEnvironment, getInputs} from './input'
import {getBranchName, getIssueKeys, getState, getArgoCD} from './utils'

async function run(): Promise<void> {
  try {
    setLogger(console)
    const logger = getLogger()
    // Using this type as this has the most supported fields
    const env = envCi() as CodefreshEnv
    const inputs = getInputs()
    const jira = await createJiraAPI(inputs)

    const state = getState()
    const branchName = getBranchName()
    const issueKeys = await getIssueKeys()

    const common = {
      name:
        process.env.CF_PIPELINE_NAME ||
        env.name,
      state,
      commit: env.commit,
      issueKeys,
      buildUrl: env.buildUrl,
      buildNumber:
        Number(process.env.CF_BUILD_NUMBER) ||
        Number(env.build),
      pipelineId: `${env.service}-${env.slug}`,
    }

    switch (inputs.event) {
      case 'build':
        const build = await sendBuildInfo(jira, {
          ...common,
          branchName,
          repoUrl: env.slug,
        })
        logger.info('Response', build)
        break
      case 'deployment':
        const deployment = await sendDeploymentInfo(jira, {
          ...common,
          environment: getEnvironment(),
          argoCD: getArgoCD(),
        })
        logger.info('Response', deployment)
        break
      default:
        throw new Error(`Invalid event_type, "${inputs.event}"`)
    }
    logger.info('Done', new Date().toTimeString())
  } catch (error) {
    console.error(error, 'Failed to send event')
    process.exit(1)
  }
}

run()
