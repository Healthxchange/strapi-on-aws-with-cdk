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
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { v4 } from "uuid";
import jwt = require("jsonwebtoken");
// @ts-ignore no declaration available
import nodeBase64 = require("nodejs-base64-converter");

export interface ECSServiceStackProps extends NestedStackProps {
  vpc: IVpc;
  dbSecret: ISecret;
  certificate: ICertificate;
  dbName: string;
  dbHostname: string;
  dbPort: string;
  applicationName: string;
}

export class ECSServiceStack extends NestedStack {
  public readonly loadBalancer: IApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props?: ECSServiceStackProps) {
    super(scope, id, props);

    const {
      vpc,
      dbSecret,
      dbHostname,
      dbName,
      dbPort,
      certificate,
      applicationName,
    } = props!;

    const strapiSecret = new Secret(this, "StrapiSecret", {
      secretName: `${applicationName}-strapi-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: jwt.sign({ subject: "jwt_secret" }, v4()),
          APP_KEYS: [1, 2, 3].map((_) => nodeBase64.encode(v4())).join(","),
          API_TOKEN_SALT: nodeBase64.encode(v4()),
          ADMIN_JWT_SECRET: jwt.sign({ subject: "admin_jwt_secret" }, v4()),
        }),
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
            DATABASE_CREDENTIALS: ecs_Secret.fromSecretsManager(dbSecret),
            JWT_SECRET: ecs_Secret.fromSecretsManager(
              strapiSecret,
              "JWT_SECRET"
            ),
            APP_KEYS: ecs_Secret.fromSecretsManager(strapiSecret, "APP_KEYS"),
            API_TOKEN_SALT: ecs_Secret.fromSecretsManager(
              strapiSecret,
              "API_TOKEN_SALT"
            ),
            ADMIN_JWT_SECRET: ecs_Secret.fromSecretsManager(
              strapiSecret,
              "ADMIN_JWT_SECRET"
            ),
          },
          image: ContainerImage.fromAsset("../cms"),
          containerPort: 1337,
          environment: {
            // JWT_SECRET:
            //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InN0cmFwaSIsImlhdCI6MTUxNjIzOTAyMn0.o6XlROlpQMpMLLJji5tWkj4NeflxB6Rqd-DAHL5Azr8",
            // APP_KEYS:
            //   "DIsdjvH6cOZREEozVuKOwQ==,VYg3XDCqvKnGcn6hpebLig==,s3jk76tPnmZGYm83+YvhUA==,bMDHp2yqwf55atUcQUhksQ==",
            // API_TOKEN_SALT: "iyWhwGXRHhKI3KegOxHOiw==",
            // ADMIN_JWT_SECRET: "mrAEF6D39AVVH6+wrE2EJQ==",
            DATABASE_CLIENT: "postgres",
            DATABASE_HOST: dbHostname,
            DATABASE_PORT: dbPort,
            DATABASE_NAME: dbName,
            HOST: "0.0.0.0",
            PORT: "1337",
          },
        },
        certificate,
      }
    );

    const policyStatement = new PolicyStatement({
      resources: [dbSecret.secretFullArn!],
      actions: ["secretsmanager:GetSecretValue"],
    });

    loadBalancedService.taskDefinition.addToExecutionRolePolicy(
      policyStatement
    );

    loadBalancedService.listener.addAction("/accept", {
      priority: 10,
      conditions: [
        ListenerCondition.pathPatterns(["/admin/*"]),
        ListenerCondition.sourceIps(["88.121.146.23/32"]),
      ],
      action: ListenerAction.forward([loadBalancedService.targetGroup]),
    });

    loadBalancedService.listener.addAction("/forbidden", {
      priority: 20,
      conditions: [ListenerCondition.pathPatterns(["/admin/*"])],
      action: ListenerAction.fixedResponse(403, {
        contentType: "text/html",
        messageBody: "Your ip address is not authorized",
      }),
    });

    this.loadBalancer = loadBalancedService.loadBalancer;
  }
}
