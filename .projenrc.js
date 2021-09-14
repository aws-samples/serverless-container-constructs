const { AwsCdkConstructLibrary, DependenciesUpgradeMechanism } = require('projen');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkConstructLibrary({
  author: 'Pahud Hsieh',
  authorAddress: 'hunhsieh@amazon.com',
  cdkVersion: '1.95.2',
  defaultReleaseBranch: 'main',
  licensed: false, // leave the LICENSE file as is.
  name: 'serverless-container-constructs',
  description: 'CDK patterns for modern application with serverless containers on AWS',
  repositoryUrl: 'https://github.com/aws-samples/serverless-container-constructs',
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-efs',
    '@aws-cdk/aws-events',
    '@aws-cdk/aws-events-targets',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-logs',
    '@aws-cdk/aws-rds',
    '@aws-cdk/aws-route53',
    '@aws-cdk/aws-route53-targets',
    '@aws-cdk/aws-secretsmanager',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-certificatemanager',
    '@aws-cdk/aws-elasticloadbalancingv2',
  ],
  minNodeVersion: '14.17.0',
  depsUpgrade: DependenciesUpgradeMechanism.githubWorkflow({
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  }),
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['pahud'],
  },
  publishToPypi: {
    distName: 'serverless-container-constructs',
    module: 'serverless_container_constructs',
  },
  catalog: {
    announce: false,
    twitter: 'pahudnet',
  },
  keywords: [
    'cdk',
    'fargate',
    'serverless',
    'aws',
  ],
});

const common_exclude = ['cdk.out', 'cdk.context.json', 'yarn-error.log', 'dependabot.yml', 'website/public', '.vscode'];
project.npmignore.exclude(...common_exclude, 'images', 'docs', 'website');
project.gitignore.exclude(...common_exclude);

project.synth();
