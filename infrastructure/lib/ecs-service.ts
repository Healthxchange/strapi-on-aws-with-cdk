import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  ContainerImage,
  Secret as ecs_Secret,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import {
  IApplicationLoadBalancer,
  ListenerAction,
  ListenerCondition,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface ECSServiceProps extends NestedStackProps {
  vpc: IVpc;
  dbSecret: ISecret;
  certificate: ICertificate;
  dbName: string;
  dbHostname: string;
  dbPort: string;
  applicationName: string;
  accessSecret: ISecret;
  s3PublicBucket: Bucket;
}

export class ECSService extends NestedStack {
  public readonly loadBalancer: IApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props?: ECSServiceProps) {
    super(scope, id, props);

    const {
      vpc,
      dbSecret,
      dbHostname,
      dbName,
      dbPort,
      certificate,
      applicationName,
      accessSecret,
      s3PublicBucket,
    } = props!;

    const strapiSecret = new Secret(this, "StrapiSecret", {
      secretName: `${applicationName}-strapi-secret`,

      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "StrapiKey",
        excludePunctuation: true,
      },
    });

    const cluster = new Cluster(this, "Cluster", { vpc });
    const loadBalancedService = new ApplicationLoadBalancedFargateService(
      this,
      "FargateService",
      {
        cluster,
        taskImageOptions: {
          secrets: {
            ...this.getSecretsDefinition(dbSecret, strapiSecret, accessSecret),
          },
          image: ContainerImage.fromAsset("../cms"),
          containerPort: 1337,
          environment: {
            DATABASE_CLIENT: "postgres",
            DATABASE_HOST: dbHostname,
            DATABASE_PORT: dbPort,
            DATABASE_NAME: dbName,
            HOST: "0.0.0.0",
            PORT: "1337",
            S3_BUCKET: s3PublicBucket.bucketDomainName,
          },
        },
        certificate,
      }
    );

    const policyStatement = new PolicyStatement({
      resources: [dbSecret.secretFullArn!, strapiSecret.secretFullArn!],
      actions: ["secretsmanager:GetSecretValue"],
    });

    loadBalancedService.taskDefinition.addToExecutionRolePolicy(
      policyStatement
    );

    this.loadBalancer = loadBalancedService.loadBalancer;
  }

  private getSecretsDefinition(dbSecret: ISecret, strapiSecret: ISecret, accessSecret: ISecret) {
    return {
      DATABASE_USERNAME: ecs_Secret.fromSecretsManager(dbSecret, "username"),
      DATABASE_PASSWORD: ecs_Secret.fromSecretsManager(dbSecret, "password"),
      JWT_SECRET: ecs_Secret.fromSecretsManager(strapiSecret, "StrapiKey"),
      APP_KEYS: ecs_Secret.fromSecretsManager(strapiSecret, "StrapiKey"),
      API_TOKEN_SALT: ecs_Secret.fromSecretsManager(strapiSecret, "StrapiKey"),
      ADMIN_JWT_SECRET: ecs_Secret.fromSecretsManager(strapiSecret, "StrapiKey"),
      ACCESS_KEY_ID: ecs_Secret.fromSecretsManager(accessSecret, "accessKeyId"),
      SECRET_ACCESS_KEY: ecs_Secret.fromSecretsManager(accessSecret, "secretAccessKey"),
    };
  }
}
