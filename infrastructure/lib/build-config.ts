export interface BuildConfig {
  readonly applicationName: string
  readonly subdomain: string
  readonly hostedZoneDomainName: string
  readonly allowedOrigins: string[]
  readonly environment: string
  readonly stackName: string
}
