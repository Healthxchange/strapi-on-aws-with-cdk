import { CfnOutput, NestedStack, NestedStackProps, SecretValue } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'

export interface S3PublicBucketProps extends NestedStackProps {
  allowedOrigins: string[]
}

export class S3PublicBucket extends NestedStack {
  public readonly accessSecret: ISecret
  public readonly bucket: s3.Bucket

  constructor(scope: Construct, id: string, props: S3PublicBucketProps) {
    super(scope, id, props)

    const { allowedOrigins } = props!

    const user = new iam.User(this, 'User')
    const accessKey = new iam.AccessKey(this, 'AccessKey', { user })

    const publicAccess = new s3.BlockPublicAccess({
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false,
    })

    const cors: s3.CorsRule = {
      allowedHeaders: ['*'],
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
        s3.HttpMethods.DELETE,
      ],
      allowedOrigins,
      maxAge: 3000,
    }

    this.bucket = new s3.Bucket(this, 'PublicBucket', {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: publicAccess,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: true,
      cors: [cors],
    })

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        effect: iam.Effect.ALLOW,
        principals: [new iam.StarPrincipal()],
        resources: [this.bucket.arnForObjects('*')],
      })
    )

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        effect: iam.Effect.DENY,
        principals: [new iam.StarPrincipal()],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    )

    const s3AccessPolicy = new iam.ManagedPolicy(this, 'S3AccessPolicy')
    s3AccessPolicy.addStatements(
      new iam.PolicyStatement({
        actions: ['s3:ListBucket', 's3:GetBucketLocation'],
        effect: iam.Effect.ALLOW,
        resources: [this.bucket.bucketArn],
      })
    )

    s3AccessPolicy.addStatements(
      new iam.PolicyStatement({
        actions: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject', 's3:PutObjectAcl'],
        effect: iam.Effect.ALLOW,
        resources: [this.bucket.arnForObjects('*')],
      })
    )

    user.addManagedPolicy(s3AccessPolicy)

    this.accessSecret = new Secret(this, 'AccessSecret', {
      secretObjectValue: {
        accessKeyId: SecretValue.unsafePlainText(accessKey.accessKeyId),
        secretAccessKey: accessKey.secretAccessKey,
      },
    })

    new CfnOutput(this, 'bucketName', { value: this.bucket.bucketName })
    new CfnOutput(this, 'accessKeyId', { value: accessKey.accessKeyId })
    new CfnOutput(this, 'secretAccessKey', { value: accessKey.secretAccessKey.unsafeUnwrap() })
  }
}
