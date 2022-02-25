# API Reference <a name="API Reference"></a>

## Constructs <a name="Constructs"></a>

### AlbFargateServices <a name="serverless-container-constructs.AlbFargateServices"></a>

#### Initializers <a name="serverless-container-constructs.AlbFargateServices.Initializer"></a>

```typescript
import { AlbFargateServices } from 'serverless-container-constructs'

new AlbFargateServices(scope: Construct, id: string, props: AlbFargateServicesProps)
```

##### `scope`<sup>Required</sup> <a name="serverless-container-constructs.AlbFargateServices.parameter.scope"></a>

- *Type:* [`constructs.Construct`](#constructs.Construct)

---

##### `id`<sup>Required</sup> <a name="serverless-container-constructs.AlbFargateServices.parameter.id"></a>

- *Type:* `string`

---

##### `props`<sup>Required</sup> <a name="serverless-container-constructs.AlbFargateServices.parameter.props"></a>

- *Type:* [`serverless-container-constructs.AlbFargateServicesProps`](#serverless-container-constructs.AlbFargateServicesProps)

---



#### Properties <a name="Properties"></a>

##### `externalAlb`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServices.property.externalAlb"></a>

```typescript
public readonly externalAlb: ApplicationLoadBalancer;
```

- *Type:* [`aws-cdk-lib.aws_elasticloadbalancingv2.ApplicationLoadBalancer`](#aws-cdk-lib.aws_elasticloadbalancingv2.ApplicationLoadBalancer)

---

##### `internalAlb`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServices.property.internalAlb"></a>

```typescript
public readonly internalAlb: ApplicationLoadBalancer;
```

- *Type:* [`aws-cdk-lib.aws_elasticloadbalancingv2.ApplicationLoadBalancer`](#aws-cdk-lib.aws_elasticloadbalancingv2.ApplicationLoadBalancer)

---


### BaseFargateServices <a name="serverless-container-constructs.BaseFargateServices"></a>

#### Initializers <a name="serverless-container-constructs.BaseFargateServices.Initializer"></a>

```typescript
import { BaseFargateServices } from 'serverless-container-constructs'

new BaseFargateServices(scope: Construct, id: string, props: BaseFargateServicesProps)
```

##### `scope`<sup>Required</sup> <a name="serverless-container-constructs.BaseFargateServices.parameter.scope"></a>

- *Type:* [`constructs.Construct`](#constructs.Construct)

---

##### `id`<sup>Required</sup> <a name="serverless-container-constructs.BaseFargateServices.parameter.id"></a>

- *Type:* `string`

---

##### `props`<sup>Required</sup> <a name="serverless-container-constructs.BaseFargateServices.parameter.props"></a>

- *Type:* [`serverless-container-constructs.BaseFargateServicesProps`](#serverless-container-constructs.BaseFargateServicesProps)

---



#### Properties <a name="Properties"></a>

##### `service`<sup>Required</sup> <a name="serverless-container-constructs.BaseFargateServices.property.service"></a>

```typescript
public readonly service: FargateService[];
```

- *Type:* [`aws-cdk-lib.aws_ecs.FargateService`](#aws-cdk-lib.aws_ecs.FargateService)[]

The service(s) created from the task(s).

---

##### `vpc`<sup>Required</sup> <a name="serverless-container-constructs.BaseFargateServices.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* [`aws-cdk-lib.aws_ec2.IVpc`](#aws-cdk-lib.aws_ec2.IVpc)

---


## Structs <a name="Structs"></a>

### AlbFargateServicesProps <a name="serverless-container-constructs.AlbFargateServicesProps"></a>

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { AlbFargateServicesProps } from 'serverless-container-constructs'

const albFargateServicesProps: AlbFargateServicesProps = { ... }
```

##### `tasks`<sup>Required</sup> <a name="serverless-container-constructs.AlbFargateServicesProps.property.tasks"></a>

```typescript
public readonly tasks: FargateTaskProps[];
```

- *Type:* [`serverless-container-constructs.FargateTaskProps`](#serverless-container-constructs.FargateTaskProps)[]

---

##### `enableExecuteCommand`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServicesProps.property.enableExecuteCommand"></a>

```typescript
public readonly enableExecuteCommand: boolean;
```

- *Type:* `boolean`
- *Default:* false

Whether to enable ECS Exec support.

> https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html

---

##### `route53Ops`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServicesProps.property.route53Ops"></a>

```typescript
public readonly route53Ops: Route53Options;
```

- *Type:* [`serverless-container-constructs.Route53Options`](#serverless-container-constructs.Route53Options)

---

##### `spot`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServicesProps.property.spot"></a>

```typescript
public readonly spot: boolean;
```

- *Type:* `boolean`
- *Default:* false

create a FARGATE_SPOT only cluster.

---

##### `vpc`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServicesProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* [`aws-cdk-lib.aws_ec2.IVpc`](#aws-cdk-lib.aws_ec2.IVpc)

---

##### `vpcSubnets`<sup>Optional</sup> <a name="serverless-container-constructs.AlbFargateServicesProps.property.vpcSubnets"></a>

```typescript
public readonly vpcSubnets: SubnetSelection;
```

- *Type:* [`aws-cdk-lib.aws_ec2.SubnetSelection`](#aws-cdk-lib.aws_ec2.SubnetSelection)
- *Default:* {
subnetType: ec2.SubnetType.PRIVATE,
}

The subnets to associate with the service.

---

### BaseFargateServicesProps <a name="serverless-container-constructs.BaseFargateServicesProps"></a>

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { BaseFargateServicesProps } from 'serverless-container-constructs'

const baseFargateServicesProps: BaseFargateServicesProps = { ... }
```

##### `tasks`<sup>Required</sup> <a name="serverless-container-constructs.BaseFargateServicesProps.property.tasks"></a>

```typescript
public readonly tasks: FargateTaskProps[];
```

- *Type:* [`serverless-container-constructs.FargateTaskProps`](#serverless-container-constructs.FargateTaskProps)[]

---

##### `enableExecuteCommand`<sup>Optional</sup> <a name="serverless-container-constructs.BaseFargateServicesProps.property.enableExecuteCommand"></a>

```typescript
public readonly enableExecuteCommand: boolean;
```

- *Type:* `boolean`
- *Default:* false

Whether to enable ECS Exec support.

> https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html

---

##### `route53Ops`<sup>Optional</sup> <a name="serverless-container-constructs.BaseFargateServicesProps.property.route53Ops"></a>

```typescript
public readonly route53Ops: Route53Options;
```

- *Type:* [`serverless-container-constructs.Route53Options`](#serverless-container-constructs.Route53Options)

---

##### `spot`<sup>Optional</sup> <a name="serverless-container-constructs.BaseFargateServicesProps.property.spot"></a>

```typescript
public readonly spot: boolean;
```

- *Type:* `boolean`
- *Default:* false

create a FARGATE_SPOT only cluster.

---

##### `vpc`<sup>Optional</sup> <a name="serverless-container-constructs.BaseFargateServicesProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* [`aws-cdk-lib.aws_ec2.IVpc`](#aws-cdk-lib.aws_ec2.IVpc)

---

##### `vpcSubnets`<sup>Optional</sup> <a name="serverless-container-constructs.BaseFargateServicesProps.property.vpcSubnets"></a>

```typescript
public readonly vpcSubnets: SubnetSelection;
```

- *Type:* [`aws-cdk-lib.aws_ec2.SubnetSelection`](#aws-cdk-lib.aws_ec2.SubnetSelection)
- *Default:* {
subnetType: ec2.SubnetType.PRIVATE,
}

The subnets to associate with the service.

---

### FargateTaskProps <a name="serverless-container-constructs.FargateTaskProps"></a>

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { FargateTaskProps } from 'serverless-container-constructs'

const fargateTaskProps: FargateTaskProps = { ... }
```

##### `listenerPort`<sup>Required</sup> <a name="serverless-container-constructs.FargateTaskProps.property.listenerPort"></a>

```typescript
public readonly listenerPort: number;
```

- *Type:* `number`

---

##### `task`<sup>Required</sup> <a name="serverless-container-constructs.FargateTaskProps.property.task"></a>

```typescript
public readonly task: FargateTaskDefinition;
```

- *Type:* [`aws-cdk-lib.aws_ecs.FargateTaskDefinition`](#aws-cdk-lib.aws_ecs.FargateTaskDefinition)

---

##### `accessibility`<sup>Optional</sup> <a name="serverless-container-constructs.FargateTaskProps.property.accessibility"></a>

```typescript
public readonly accessibility: LoadBalancerAccessibility;
```

- *Type:* [`serverless-container-constructs.LoadBalancerAccessibility`](#serverless-container-constructs.LoadBalancerAccessibility)
- *Default:* both

Register the service to internal ELB, external ELB or both.

---

##### `capacityProviderStrategy`<sup>Optional</sup> <a name="serverless-container-constructs.FargateTaskProps.property.capacityProviderStrategy"></a>

```typescript
public readonly capacityProviderStrategy: CapacityProviderStrategy[];
```

- *Type:* [`aws-cdk-lib.aws_ecs.CapacityProviderStrategy`](#aws-cdk-lib.aws_ecs.CapacityProviderStrategy)[]

---

##### `desiredCount`<sup>Optional</sup> <a name="serverless-container-constructs.FargateTaskProps.property.desiredCount"></a>

```typescript
public readonly desiredCount: number;
```

- *Type:* `number`
- *Default:* 1

desired number of tasks for the service.

---

##### `scalingPolicy`<sup>Optional</sup> <a name="serverless-container-constructs.FargateTaskProps.property.scalingPolicy"></a>

```typescript
public readonly scalingPolicy: ServiceScalingPolicy;
```

- *Type:* [`serverless-container-constructs.ServiceScalingPolicy`](#serverless-container-constructs.ServiceScalingPolicy)
- *Default:* { maxCapacity: 10, targetCpuUtilization: 50, requestsPerTarget: 1000 }

service autoscaling policy.

---

### Route53Options <a name="serverless-container-constructs.Route53Options"></a>

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { Route53Options } from 'serverless-container-constructs'

const route53Options: Route53Options = { ... }
```

##### `externalElbRecordName`<sup>Optional</sup> <a name="serverless-container-constructs.Route53Options.property.externalElbRecordName"></a>

```typescript
public readonly externalElbRecordName: string;
```

- *Type:* `string`
- *Default:* external

the external ELB record name.

---

##### `internalElbRecordName`<sup>Optional</sup> <a name="serverless-container-constructs.Route53Options.property.internalElbRecordName"></a>

```typescript
public readonly internalElbRecordName: string;
```

- *Type:* `string`
- *Default:* internal

the internal ELB record name.

---

##### `zoneName`<sup>Optional</sup> <a name="serverless-container-constructs.Route53Options.property.zoneName"></a>

```typescript
public readonly zoneName: string;
```

- *Type:* `string`
- *Default:* svc.local

private zone name.

---

### ServiceScalingPolicy <a name="serverless-container-constructs.ServiceScalingPolicy"></a>

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { ServiceScalingPolicy } from 'serverless-container-constructs'

const serviceScalingPolicy: ServiceScalingPolicy = { ... }
```

##### `maxCapacity`<sup>Optional</sup> <a name="serverless-container-constructs.ServiceScalingPolicy.property.maxCapacity"></a>

```typescript
public readonly maxCapacity: number;
```

- *Type:* `number`
- *Default:* 10

max capacity for the service autoscaling.

---

##### `requestPerTarget`<sup>Optional</sup> <a name="serverless-container-constructs.ServiceScalingPolicy.property.requestPerTarget"></a>

```typescript
public readonly requestPerTarget: number;
```

- *Type:* `number`
- *Default:* 1000

request per target.

---

##### `targetCpuUtilization`<sup>Optional</sup> <a name="serverless-container-constructs.ServiceScalingPolicy.property.targetCpuUtilization"></a>

```typescript
public readonly targetCpuUtilization: number;
```

- *Type:* `number`
- *Default:* 50

target cpu utilization.

---



## Enums <a name="Enums"></a>

### LoadBalancerAccessibility <a name="LoadBalancerAccessibility"></a>

The load balancer accessibility.

#### `EXTERNAL_ONLY` <a name="serverless-container-constructs.LoadBalancerAccessibility.EXTERNAL_ONLY"></a>

register to external load balancer only.

---


#### `INTERNAL_ONLY` <a name="serverless-container-constructs.LoadBalancerAccessibility.INTERNAL_ONLY"></a>

register to internal load balancer only.

---

