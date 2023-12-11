export interface BuildConfig {
  readonly applicationName: string
  readonly subdomain: string
  readonly hostedZoneDomainName: string
  readonly allowedOrigin: string
  readonly environment: string
  readonly stackName: string
}
