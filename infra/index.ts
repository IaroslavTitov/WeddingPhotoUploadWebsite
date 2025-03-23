import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Photo bucket
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
      },
    ],
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

export const photoBucketName = photoBucket.bucket;
export const webUserAccessKeyId = pulumi.secret(webUserAccessKey.id);
export const webUserSecretAccessKey = pulumi.secret(webUserAccessKey.secret);
