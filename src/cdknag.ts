import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

interface ruleToSuppress {
  readonly id: string;
  readonly reason: string;
}

export class Suppress {
  static bucket(construct: cdk.Construct, rulesToSuppress: ruleToSuppress[] ) {
    const cfnResource = construct?.node.defaultChild as s3.CfnBucket;
    cfnResource?.addMetadata('cdk_nag', { rules_to_suppress: rulesToSuppress });
  }
  static securityGroup(construct: cdk.Construct, rulesToSuppress: ruleToSuppress[]) {
    const cfnResource = construct?.node.defaultChild as ec2.CfnSecurityGroup;
    cfnResource?.addMetadata('cdk_nag', { rules_to_suppress: rulesToSuppress });
  }
  static iamPolicy(construct: cdk.Construct, rulesToSuppress: ruleToSuppress[]) {
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
export class AccessLogDeliveryBucket extends cdk.Construct {
  readonly bucket: s3.Bucket;
  constructor(scope: cdk.Construct, id: string, props: BucketProps = {}) {
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
