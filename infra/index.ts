import * as aws from "@pulumi/aws";
import * as command from "@pulumi/command";

const siteBucket = new aws.s3.BucketV2("wedding-photos-site-bucket", {
    bucket: "wedding-photos-site-bucket",
});

function publicReadPolicyForBucket(bucketName: string) {
    return JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: "*",
        Action: [
          "s3:GetObject"
        ],
        Resource: [
          `arn:aws:s3:::${bucketName}/*`
        ]
      }]
    })
  }
  
let _ = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: siteBucket.bucket,
    policy: siteBucket.bucket.apply(publicReadPolicyForBucket)
});

const webapp = new aws.s3.BucketWebsiteConfigurationV2("webapp", {
    bucket: siteBucket.id,
    indexDocument: {
        suffix: "index.html",
    },
});

const syncCommand = new command.local.Command("S3 bucket sync", {
    create: siteBucket.bucket.apply(bucket => `aws s3 sync ../webapp/out s3://${bucket}`),
    triggers: [new Date().toISOString()], // Ensure the command runs every time
});

export const websiteURL = webapp.websiteEndpoint;
