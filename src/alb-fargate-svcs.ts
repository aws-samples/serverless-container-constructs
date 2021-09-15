import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as cdk from '@aws-cdk/core';
import * as cdknag from './cdknag';
import { BaseFargateServices, BaseFargateServicesProps, LoadBalancerAccessibility } from './main';

export interface AlbFargateServicesProps extends BaseFargateServicesProps {}

export class AlbFargateServices extends BaseFargateServices {
  readonly externalAlb?: elbv2.ApplicationLoadBalancer
  readonly internalAlb?: elbv2.ApplicationLoadBalancer
  constructor(scope: cdk.Construct, id: string, props: AlbFargateServicesProps) {
    super(scope, id, props);

    // create the access log bucket
    const accessLogBucket = new cdknag.AccessLogDeliveryBucket(this, 'AccessLogBucket').bucket;

    if (this.hasExternalLoadBalancer) {
      this.externalAlb = new elbv2.ApplicationLoadBalancer(this, 'ExternalAlb', {
        vpc: this.vpc,
        internetFacing: true,
      });
      this.externalAlb.logAccessLogs(accessLogBucket, `${id}-extalblog`);
    }

    if (this.hasInternalLoadBalancer) {
      this.internalAlb = new elbv2.ApplicationLoadBalancer(this, 'InternalAlb', {
        vpc: this.vpc,
        internetFacing: false,
      });
      this.internalAlb.logAccessLogs(accessLogBucket, `${id}-intalblog`);
    }

    props.tasks.forEach((t, index )=> {
      const defaultContainerName = t.task.defaultContainer?.containerName;

      // default scaling policy
      const scaling = this.service[index].autoScaleTaskCount({ maxCapacity: t.scalingPolicy?.maxCapacity ?? 10 });
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: t.scalingPolicy?.targetCpuUtilization ?? 50,
      });

      if (t.accessibility != LoadBalancerAccessibility.INTERNAL_ONLY) {
        const exttg = new elbv2.ApplicationTargetGroup(this, `${defaultContainerName}ExtTG`, {
          protocol: elbv2.ApplicationProtocol.HTTP,
          vpc: this.vpc,
        });
        // listener for the external ALB
        new elbv2.ApplicationListener(this, `ExtAlbListener${t.listenerPort}`, {
          loadBalancer: this.externalAlb!,
          open: true,
          port: t.listenerPort,
          protocol: elbv2.ApplicationProtocol.HTTP,
          defaultTargetGroups: [exttg],
        });
        scaling.scaleOnRequestCount('RequestScaling', {
          requestsPerTarget: t.scalingPolicy?.requestPerTarget ?? 1000,
          targetGroup: exttg,
        });
        exttg.addTarget(this.service[index]);
      }

      if (t.accessibility != LoadBalancerAccessibility.EXTERNAL_ONLY) {
        const inttg = new elbv2.ApplicationTargetGroup(this, `${defaultContainerName}IntTG`, {
          protocol: elbv2.ApplicationProtocol.HTTP,
          vpc: this.vpc,
        });

        // listener for the internal ALB
        new elbv2.ApplicationListener(this, `IntAlbListener${t.listenerPort}`, {
          loadBalancer: this.internalAlb!,
          open: true,
          port: t.listenerPort,
          protocol: elbv2.ApplicationProtocol.HTTP,
          defaultTargetGroups: [inttg],
        });

        // extra scaling policy
        scaling.scaleOnRequestCount('RequestScaling2', {
          requestsPerTarget: t.scalingPolicy?.requestPerTarget ?? 1000,
          targetGroup: inttg,
        });
        inttg.addTarget(this.service[index]);
      }

    });

    // Route53
    const externalAlbRecordName = props.route53Ops?.externalElbRecordName ?? 'external';
    const internalAlbRecordName = props.route53Ops?.internalElbRecordName ?? 'internal';
    const zone = new route53.PrivateHostedZone(this, 'HostedZone', {
      zoneName: this.zoneName,
      vpc: this.vpc,
    });

    if (this.hasInternalLoadBalancer) {
      new route53.ARecord(this, 'InternalAlbAlias', {
        zone,
        recordName: internalAlbRecordName,
        target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(this.internalAlb!)),
      });
    }


    if (this.hasExternalLoadBalancer) {
      new route53.ARecord(this, 'ExternalAlbAlias', {
        zone,
        recordName: externalAlbRecordName,
        target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(this.externalAlb!)),
      });
    }

    if (this.hasExternalLoadBalancer) {
      new cdk.CfnOutput(this, 'ExternalEndpoint', { value: `http://${this.externalAlb!.loadBalancerDnsName}` });
      new cdk.CfnOutput(this, 'ExternalEndpointPrivate', { value: `http://${externalAlbRecordName}.${this.zoneName}` });
    }
    if (this.hasInternalLoadBalancer) {
      new cdk.CfnOutput(this, 'InternalEndpoint', { value: `http://${this.internalAlb!.loadBalancerDnsName}` });
      new cdk.CfnOutput(this, 'InternalEndpointPrivate', { value: `http://${internalAlbRecordName}.${this.zoneName}` });
    }

    // ensure the dependency
    const cp = this.node.tryFindChild('Cluster') as ecs.CfnClusterCapacityProviderAssociations;
    this.service.forEach(s => {
      s.node.addDependency(cp);
    });

    // add solution ID for the stack
    if (!cdk.Stack.of(this).templateOptions.description) {
      cdk.Stack.of(this).templateOptions.description = '(SO8030) - AWS CDK stack with serverless-container-constructs';
    }

    /**
     * suppress the cdk-nag rules
     */
    if (this.externalAlb) {
      let sg: ec2.CfnSecurityGroup;
      sg = this.externalAlb.node.tryFindChild('SecurityGroup') as ec2.CfnSecurityGroup;
      cdknag.Suppress.securityGroup(sg, [
        {
          id: 'AwsSolutions-EC23',
          reason: 'public ALB requires 0.0.0.0/0 inbound access',
        },
      ]);
    }
    if (this.internalAlb) {
      let sg: ec2.CfnSecurityGroup;
      sg = this.internalAlb.node.tryFindChild('SecurityGroup') as ec2.CfnSecurityGroup;
      cdknag.Suppress.securityGroup(sg, [
        {
          id: 'AwsSolutions-EC23',
          reason: 'internal ALB requires 0.0.0.0/0 inbound access',
        },
      ]);
    }
    props.tasks.forEach(t => {
      let cfnPolicy = t.task.executionRole?.node.tryFindChild('DefaultPolicy') as iam.Policy;
      cdknag.Suppress.iamPolicy(cfnPolicy, [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'ecr:GetAuthorizationToken requires wildcard resource',
        },
      ]);
      cfnPolicy = t.task.taskRole?.node.tryFindChild('DefaultPolicy') as iam.Policy;
      cdknag.Suppress.iamPolicy(cfnPolicy, [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'task role with ECS exec support requires wildcard resource for ssmmessages. see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html',
        },
      ]);
    });

  }
}