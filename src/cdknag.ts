import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface ruleToSuppress {
  readonly id: string;
  readonly reason: string;
}

export class Suppress {
  static bucket(construct: Construct, rulesToSuppress: ruleToSuppress[] ) {
    const cfnResource = construct?.node.defaultChild as s3.CfnBucket;
    cfnResource?.addMetadata('cdk_nag', { rules_to_suppress: rulesToSuppress });
  }
  static securityGroup(construct: Construct, rulesToSuppress: ruleToSuppress[]) {
    const cfnResource = construct?.node.defaultChild as ec2.CfnSecurityGroup;
    cfnResource?.addMetadata('cdk_nag', { rules_to_suppress: rulesToSuppress });
  }
  static iamPolicy(construct: Construct, rulesToSuppress: ruleToSuppress[]) {
    const cfnResource = construct?.node.defaultChild as iam.CfnPolicy;
    cfnResource?.addMetadata('cdk_nag', { rules_to_suppress: rulesToSuppress });
  }
}


export interface BucketProps {
  readonly serverAccessLogsPrefix?: string;
}

/**
 * The generic access log and log delivery bucket.
 */
export class AccessLogDeliveryBucket extends Construct {
  readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: BucketProps = {}) {
    super(scope, id);
    this.bucket = new s3.Bucket(this, id, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      serverAccessLogsPrefix: props.serverAccessLogsPrefix ?? 'access-log-',
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    });
    Suppress.bucket(this.bucket, [
      { id: 'AwsSolutions-S1', reason: 'implicitly set current bucket as the acces log bucket' },
    ]);
  }
}
