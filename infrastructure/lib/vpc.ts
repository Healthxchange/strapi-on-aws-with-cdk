import { NestedStack, StackProps } from 'aws-cdk-lib'
import { IpAddresses, IVpc, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

export class StrapiVpc extends NestedStack {
  public readonly vpc: IVpc

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.vpc = new Vpc(this, 'StrapiVPC', {
      ipAddresses: IpAddresses.cidr('10.1.0.0/16'),
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: 'isolated-subnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    })
  }
}
