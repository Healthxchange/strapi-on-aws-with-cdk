import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Certificate } from './certificate'
import Database from './database'
import { ECSService } from './ecs-service'
import { Route53Record } from './route53-record'
import { StrapiVpc } from './vpc'
import { S3PublicBucket } from './public-s3-bucket'
import { SecurityGroup, Port } from 'aws-cdk-lib/aws-ec2'
import { BuildConfig } from './build-config'

class StrapiStack extends Stack {
  constructor(scope: Construct, id: string, buildConfig: BuildConfig, props?: StackProps) {
    super(scope, id, props)

    const vpc = new StrapiVpc(this, StrapiVpc.name, {})

    const stackName = buildConfig.stackName
    const hostedZoneDomainName = buildConfig.hostedZoneDomainName
    const allowedOrigin = buildConfig.allowedOrigin

    const domainName = `${buildConfig.subdomain}.${hostedZoneDomainName}`

    const sg = new SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc: vpc.vpc,
    })

    const database = new Database(this, Database.name, {
      applicationName: stackName,
      vpc: vpc.vpc,
      sg,
    })

    const certificate = new Certificate(this, Certificate.name, {
      hostedZoneDomainName,
      domainName,
    })

    const publicBucket = new S3PublicBucket(this, S3PublicBucket.name, {
      allowedOrigin,
    })

    const ecsServiceStack = new ECSService(this, ECSService.name, {
      certificate: certificate.certificate,
      dbHostname: database.dbCluster.clusterEndpoint.hostname.toString(),
      dbPort: database.dbCluster.clusterEndpoint.port.toString(),
      dbName: stackName,
      dbSecret: database.dbSecret,
      vpc: vpc.vpc,
      sg,
      applicationName: stackName,
      accessSecret: publicBucket.accessSecret,
      s3PublicBucket: publicBucket.bucket,
    })

    new Route53Record(this, Route53Record.name, {
      hostedZoneDomainName,
      applicationName: buildConfig.subdomain,
      loadBalancer: ecsServiceStack.loadBalancer,
    })
  }
}

export { StrapiStack }
