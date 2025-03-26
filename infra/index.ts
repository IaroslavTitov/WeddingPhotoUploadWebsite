import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

//#region Photo bucket
const photoBucket = new aws.s3.BucketV2("photoBucket");

const photoBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "photoBucketPublicAccessBlock",
  {
    bucket: photoBucket.bucket,
    blockPublicAcls: false,
    ignorePublicAcls: false,
    blockPublicPolicy: false,
    restrictPublicBuckets: false,
  }
);

const photoBucketCorsConfiguration = new aws.s3.BucketCorsConfigurationV2(
  "photoBucketCorsConfiguration",
  {
    bucket: photoBucket.bucket,
    corsRules: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "HEAD"],
        allowedOrigins: ["*"],
        maxAgeSeconds: 3000,
      },
    ],
  }
);

const photoBucketOwnershipControls = new aws.s3.BucketOwnershipControls(
  "photoBucketOwnershipControls",
  {
    bucket: photoBucket.bucket,
    rule: {
      objectOwnership: "ObjectWriter",
    },
  }
);

const photoBucketPolicy = new aws.s3.BucketPolicy(
  "photoBucketPolicy",
  {
    bucket: photoBucket.bucket,
    policy: photoBucket.bucket.apply((bucketName) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      })
    ),
  },
  {
    dependsOn: photoBucketPublicAccessBlock,
  }
);
//#endregion

//#region Web user
const webUser = new aws.iam.User("webUser");

const webUserAccessKey = new aws.iam.AccessKey("webUserAccessKey", {
  user: webUser.name,
});

const webUserPhotoBucketPolicy = new aws.iam.Policy(
  "webUserPhotoBucketPolicy",
  {
    policy: photoBucket.arn.apply((photoBucketArn) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:PutObject"],
            Effect: "Allow",
            Resource: `${photoBucketArn}/*`,
          },
          {
            Action: ["s3:ListBucket"],
            Effect: "Allow",
            Resource: `${photoBucketArn}`,
          },
        ],
      })
    ),
  }
);

const webUserPhotoBucketPolicyAttachment = new aws.iam.UserPolicyAttachment(
  "userPolicyAttachment",
  {
    user: webUser.name,
    policyArn: webUserPhotoBucketPolicy.arn,
  }
);
//#endregion

//#region Webapp
const ecrRepo = new aws.ecr.Repository("wedding-repo");

const webappImage = new awsx.ecr.Image("webappImage", {
  repositoryUrl: ecrRepo.repositoryUrl,
  imageName: "wedding-photos-webapp",
  imageTag: "latest",
  context: "../webapp",
});

const appRunnerRole = new aws.iam.Role("appRunnerRole", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Sid: "",
        Principal: {
          Service: ["build.apprunner.amazonaws.com"],
        },
      },
    ],
  },
});

const ecrAccessRolePolicy = new aws.iam.RolePolicy("ecrAccessRolePolicy", {
  role: appRunnerRole.name,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
        ],
        Resource: "*",
      },
    ],
  }),
});

const appRunnerService = new aws.apprunner.Service("appRunnerService", {
  serviceName: "wedding-photos-webapp",
  sourceConfiguration: {
    authenticationConfiguration: {
      accessRoleArn: appRunnerRole.arn,
    },
    imageRepository: {
      imageIdentifier: webappImage.imageUri,
      imageConfiguration: {
        port: "3000",
      },
      imageRepositoryType: "ECR",
    },
  },
  instanceConfiguration: {
    cpu: "256",
    memory: "512",
  },
  healthCheckConfiguration: {
    path: "/",
    protocol: "HTTP",
    interval: 10,
    timeout: 5,
    healthyThreshold: 1,
    unhealthyThreshold: 5,
  },
});

//#endregion

export const photoBucketName = photoBucket.bucket;
export const webUserAccessKeyId = pulumi.secret(webUserAccessKey.id);
export const webUserSecretAccessKey = pulumi.secret(webUserAccessKey.secret);
