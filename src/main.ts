import {
  Stack,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdknag from './cdknag';
import { getOrCreateVpc } from './common/common-functions';

export interface BaseFargateServicesProps {
  readonly vpc?: ec2.IVpc;
  readonly tasks: FargateTaskProps[];
  readonly route53Ops?: Route53Options;
  /**
   * create a FARGATE_SPOT only cluster
   * @default false
   */
  readonly spot?: boolean;
  /**
   * Whether to enable ECS Exec support
   * @see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
   * @default false
   */
  readonly enableExecuteCommand?: boolean;
  /**
   * The subnets to associate with the service.
   * @default -
   * {
   *       subnetType: ec2.SubnetType.PRIVATE,
   * }
   */
  readonly vpcSubnets?: ec2.SubnetSelection;
}

/**
 * The load balancer accessibility.
 */
export enum LoadBalancerAccessibility {
  /**
   * register to external load balancer only
   */
  EXTERNAL_ONLY = 'EXTERNAL_ONLY',
  /**
   * register to internal load balancer only
   */
  INTERNAL_ONLY = 'INTERNAL_ONLY',
}

export interface FargateTaskProps {
  readonly task: ecs.FargateTaskDefinition;
  readonly listenerPort: number;
  /**
   * desired number of tasks for the service
   * @default 1
   */
  readonly desiredCount?: number;
  /**
   * service autoscaling policy
   * @default - { maxCapacity: 10, targetCpuUtilization: 50, requestsPerTarget: 1000 }
   */
  readonly scalingPolicy?: ServiceScalingPolicy;
  readonly capacityProviderStrategy?: ecs.CapacityProviderStrategy[];
  /**
   * Register the service to internal ELB, external ELB or both.
   * @default both
   */
  readonly accessibility?: LoadBalancerAccessibility;
}


export interface ServiceScalingPolicy {
  /**
   * max capacity for the service autoscaling
   * @default 10
   */
  readonly maxCapacity?: number;
  /**
   * target cpu utilization
   * @default 50
   */
  readonly targetCpuUtilization?: number;
  /**
   * request per target
   * @default 1000
   */
  readonly requestPerTarget?: number;
}

export interface Route53Options {
  /**
   * private zone name
   * @default svc.local
   */
  readonly zoneName?: string;
  /**
   * the external ELB record name
   * @default external
   */
  readonly externalElbRecordName?: string;
  /**
   * the internal ELB record name
   * @default internal
   */
  readonly internalElbRecordName?: string;
}

export abstract class BaseFargateServices extends Construct {
  readonly vpc: ec2.IVpc;
  /**
   * The service(s) created from the task(s)
   */
  readonly service: ecs.FargateService[];
  protected zoneName: string = '';
  protected hasExternalLoadBalancer: boolean = false;
  protected hasInternalLoadBalancer: boolean = false;
  protected vpcSubnets: ec2.SubnetSelection = { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT };
  /**
   * determine if vpcSubnets are all public ones
   */
  private isPublicSubnets: boolean = false;
  constructor(scope: Construct, id: string, props: BaseFargateServicesProps) {
    super(scope, id);

    this.vpc = props.vpc ?? getOrCreateVpc(this),
    this.service = [];
    if (props.vpcSubnets) {
      this.vpcSubnets = props.vpcSubnets;
      this.validateSubnets(this.vpc, this.vpcSubnets);
    }


    // determine whether we need the external LB
    props.tasks.forEach(t => {
      // determine the accessibility
      if (t.accessibility != LoadBalancerAccessibility.INTERNAL_ONLY ) {
        this.hasExternalLoadBalancer = true;
      }
      if (t.accessibility != LoadBalancerAccessibility.EXTERNAL_ONLY) {
        this.hasInternalLoadBalancer = true;
      }
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: this.vpc,
      enableFargateCapacityProviders: true,
      containerInsights: true,
      executeCommandConfiguration: {
        logging: ecs.ExecuteCommandLogging.DEFAULT,
      },
    });

    const spotOnlyStrategy = [
      {
        capacityProvider: 'FARGATE_SPOT',
        base: 0,
        weight: 1,
      },
      {
        capacityProvider: 'FARGATE',
        base: 0,
        weight: 0,
      },
    ];

    props.tasks.forEach(t => {
      const defaultContainerName = t.task.defaultContainer?.containerName;
      const svc = new ecs.FargateService(this, `${defaultContainerName}Service`, {
        taskDefinition: t.task,
        cluster,
        capacityProviderStrategies: t.capacityProviderStrategy ?? ( props.spot ? spotOnlyStrategy : undefined ),
        desiredCount: t.desiredCount,
        enableExecuteCommand: props.enableExecuteCommand ?? false,
        vpcSubnets: this.vpcSubnets,
        assignPublicIp: this.isPublicSubnets,
      });
      this.service.push(svc);
    });

    // Route53
    this.zoneName = props.route53Ops?.zoneName ?? 'svc.local';

    // ensure the dependency
    const cp = this.node.tryFindChild('Cluster') as ecs.CfnClusterCapacityProviderAssociations;
    this.service.forEach(s => {
      s.node.addDependency(cp);
    });

    // add solution ID for the stack
    if (!Stack.of(this).templateOptions.description) {
      Stack.of(this).templateOptions.description = '(SO8030) - AWS CDK stack with serverless-container-constructs';
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

  private validateSubnets(vpc: ec2.IVpc, vpcSubnets: ec2.SubnetSelection) {
    const subnets = vpc.selectSubnets(vpcSubnets);
    // get all subnets in the VPC
    const allsubnetIds = vpc.publicSubnets.concat(vpc.privateSubnets).concat(vpc.isolatedSubnets).map(x => x.subnetId);
    // validate the given subnets
    subnets.subnetIds.forEach(s => {
      if (!allsubnetIds.includes(s)) {
        throw new Error(`${s} does not exist in the VPC`);
      }
      if (vpc.isolatedSubnets.map(i => i.subnetId).includes(s)) {
        throw new Error(`Isolated subnet ${s} is not allowed`);
      }
    });
    const hasPublic = subnets.subnetIds.some(s => new Set(vpc.publicSubnets.map(x => x.subnetId)).has(s));
    const hasPrivate = subnets.subnetIds.some(s => new Set(vpc.privateSubnets.map(x => x.subnetId)).has(s));
    if (hasPublic && hasPrivate) {
      throw new Error('You should provide either all public or all private subnets, not both.');
    }
    this.isPublicSubnets = subnets.subnetIds.some(s => new Set(vpc.publicSubnets.map(x => x.subnetId)).has(s));
  }
}