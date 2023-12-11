#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import 'source-map-support/register'
import { StrapiStack } from '../lib/strapi'
import { BuildConfig } from '../lib/build-config'

const app = new cdk.App()

function ensureString(object: { [name: string]: any }, propName: string): string {
  if (!object[propName] || object[propName].trim().length === 0)
    throw new Error(propName + ' does not exist or is empty')

  return object[propName]
}

function getConfig() {
  let env = app.node.tryGetContext('config')
  if (!env) throw new Error('Context variable missing on CDK command. Pass in as `-c config=XXX`')

  let unparsedEnv = app.node.tryGetContext(env)

  let buildConfig: BuildConfig = {
    applicationName: ensureString(unparsedEnv, 'applicationName'),
    subdomain: ensureString(unparsedEnv, 'subdomain'),
    hostedZoneDomainName: ensureString(unparsedEnv, 'hostedZoneDomainName'),
    allowedOrigin: ensureString(unparsedEnv, 'allowedOrigin'),
    environment: env,
    stackName: ensureString(unparsedEnv, 'applicationName') + env,
  }

  return buildConfig
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
}

async function Main() {
  let buildConfig: BuildConfig = getConfig()

  cdk.Tags.of(app).add('App', buildConfig.applicationName)
  cdk.Tags.of(app).add('Environment', buildConfig.environment)

  let mainStackName = buildConfig.stackName + 'stack'
  new StrapiStack(app, mainStackName, buildConfig, {
    env,
    terminationProtection: true,
  })
}
Main()
