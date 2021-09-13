import '@aws-cdk/assert/jest';
import * as path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { AlbFargateServices, LoadBalancerAccessibility } from '../src/index';

let app: cdk.App;
let env: { region: string; account: string };
let stack: cdk.Stack;


beforeEach(() => {
  app = new cdk.App();
  env = {
    region: 'us-east-1',
    account: '123456789012',
  };
  stack = new cdk.Stack(app, 'demo-stack', { env });
});


// match snapshot
test('Snapshot', () => {
  const orderTask = new ecs.FargateTaskDefinition(stack, 'orderTask', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  const zoneName = 'svc.local';
  const internalAlbRecordName = 'internal';
  const externalAlbRecordName = 'external';
  const internalALBEndpoint = `http://${internalAlbRecordName}.${zoneName}`;

  orderTask.addContainer('order', {
    image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../services/OrderService')),
    portMappings: [
      { containerPort: 8080 },
    ],
    environment: {
      PRODUCT_SVC_URL: `${internalALBEndpoint}:9090`,
      CUSTOMER_SVC_URL: `${internalALBEndpoint}:8080`,
      serviceName: 'order',
      versionNum: '1.0',
    },
  });

  const customerTask = new ecs.FargateTaskDefinition(stack, 'customerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  customerTask.addContainer('customer', {
    image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../services/CommonService')),
    portMappings: [
      { containerPort: 8080 },
    ],
    environment: {
      PRODUCT_SVC_URL: `${internalALBEndpoint}:9090`,
      CUSTOMER_SVC_URL: `${internalALBEndpoint}:8080`,
      serviceName: 'customer',
      versionNum: '1.0',
    },
  });

  const productTask = new ecs.FargateTaskDefinition(stack, 'productTask', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  productTask.addContainer('product', {
    image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../services/CommonService')),
    portMappings: [
      { containerPort: 8080 },
    ],
    environment: {
      PRODUCT_SVC_URL: `${internalALBEndpoint}:9090`,
      CUSTOMER_SVC_URL: `${internalALBEndpoint}:8080`,
      serviceName: 'product',
      versionNum: '1.0',
    },
  });

  new AlbFargateServices(stack, 'Service', {
    spot: true, // FARGATE_SPOT only cluster
    tasks: [
      {
        listenerPort: 80,
        task: orderTask,
        desiredCount: 2,
        // customize the service autoscaling policy
        scalingPolicy: {
          maxCapacity: 20,
          requestPerTarget: 1000,
          targetCpuUtilization: 50,
        },
      },
      { listenerPort: 8080, task: customerTask, desiredCount: 2 },
      { listenerPort: 9090, task: productTask, desiredCount: 2 },
    ],
    route53Ops: {
      zoneName, // svc.local
      externalAlbRecordName, // external.svc.local
      internalAlbRecordName, // internal.svc.local
    },
  });
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});

test('AlbFargateServices - minimal setup', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [{ listenerPort: 80, task }],
  });

  // THEN
  // We should have two ALBs
  // the external one
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
    Type: 'application',
  });
  // the internal one
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internal',
    Type: 'application',
  });
  // We should have fargate service
  expect(stack).toHaveResource('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
});

test('AlbFargateServices - internal only', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [{ listenerPort: 80, task, accessibility: LoadBalancerAccessibility.INTERNAL_ONLY }],
  });

  // THEN
  // we should NOT have the external ALB
  expect(stack).not.toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
    Type: 'application',
  });
  // we should have the internal ALB
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internal',
    Type: 'application',
  });
  // We should have fargate service
  expect(stack).toHaveResource('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
});

test('AlbFargateServices - external only', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [{ listenerPort: 80, task, accessibility: LoadBalancerAccessibility.EXTERNAL_ONLY }],
  });

  // THEN
  // we should NOT have the internal ALB
  expect(stack).not.toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internal',
    Type: 'application',
  });
  // we should have the external ALB
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
    Type: 'application',
  });
  // We should have fargate service
  expect(stack).toHaveResource('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
});


test('AlbFargateServices - partial internal only', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  const task2 = new ecs.FargateTaskDefinition(stack, 'task2', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task2.addContainer('caddy', {
    image: ecs.ContainerImage.fromRegistry('caddy'),
    portMappings: [{ containerPort: 2015 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [
      { listenerPort: 80, task, accessibility: LoadBalancerAccessibility.INTERNAL_ONLY },
      { listenerPort: 8080, task: task2 },
    ],
  });

  // THEN
  // we should still have the external ALB
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
    Type: 'application',
  });
  // we should have the internal ALB
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internal',
    Type: 'application',
  });
  // We should have fargate service
  expect(stack).toHaveResource('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
});

test('AlbFargateServices - partial external only', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  const task2 = new ecs.FargateTaskDefinition(stack, 'task2', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task2.addContainer('caddy', {
    image: ecs.ContainerImage.fromRegistry('caddy'),
    portMappings: [{ containerPort: 2015 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [
      { listenerPort: 80, task, accessibility: LoadBalancerAccessibility.EXTERNAL_ONLY },
      { listenerPort: 8080, task: task2 },
    ],
  });

  // THEN
  // we should still have the external ALB
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
    Type: 'application',
  });
  // we should have the internal ALB
  expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internal',
    Type: 'application',
  });
  // We should have fargate service
  expect(stack).toHaveResource('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
});


test('AlbFargateServices - vpc subnet select default select private subnet', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [
      { listenerPort: 8080, task },
    ],
  });

  // THEN
  // we should still have the assgin public Ip.
  expect(stack).toHaveResource('AWS::ECS::Service', {
    NetworkConfiguration: {
      AwsvpcConfiguration: {
        AssignPublicIp: 'DISABLED',
        SecurityGroups: [
          {
            'Fn::GetAtt': [
              'ServicenginxServiceSecurityGroupD362365D',
              'GroupId',
            ],
          },
        ],
        Subnets: [
          {
            Ref: 'ServiceVpcPrivateSubnet1Subnet5DB98340',
          },
          {
            Ref: 'ServiceVpcPrivateSubnet2Subnet0A0B778B',
          },
          {
            Ref: 'ServiceVpcPrivateSubnet3SubnetFED5903C',
          },
        ],
      },
    },
  });
});


test('AlbFargateServices - vpc subnet select test select public subnet', () => {
  // GIVEN
  // WHEN
  const task = new ecs.FargateTaskDefinition(stack, 'task', {
    cpu: 256,
    memoryLimitMiB: 512,
  });

  task.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    portMappings: [{ containerPort: 80 }],
  });

  new AlbFargateServices(stack, 'Service', {
    tasks: [
      { listenerPort: 8080, task },
    ],
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
  });

  // THEN
  // we should still have the assgin public Ip.
  expect(stack).toHaveResource('AWS::ECS::Service', {
    NetworkConfiguration: {
      AwsvpcConfiguration: {
        AssignPublicIp: 'ENABLED',
        SecurityGroups: [
          {
            'Fn::GetAtt': [
              'ServicenginxServiceSecurityGroupD362365D',
              'GroupId',
            ],
          },
        ],
        Subnets: [
          {
            Ref: 'ServiceVpcPublicSubnet1Subnet7B418339',
          },
          {
            Ref: 'ServiceVpcPublicSubnet2SubnetDE1A00CE',
          },
          {
            Ref: 'ServiceVpcPublicSubnet3SubnetDDA2D85D',
          },
        ],
      },
    },
  });
});
