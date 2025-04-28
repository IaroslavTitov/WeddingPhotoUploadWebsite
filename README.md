# Summary

This project allows anyone to easily deploy a customized wedding/event photo upload website, allowing you to easily receive and share photos between guests.

# Backstory

During preparation for our wedding, my then-fiance-now-wife and I realized that we wanted an easy solution for our guests to upload and share pictures. While there are plenty solutions on the market, it didn't sit well with me to pay $50-100 for essentially a nice-ish interface to an S3 bucket. Being an engineer, I decided to build one myself, and make it easily reproducible using Pulumi IaC and ESC.

![image](image.png)

# How to deploy your own wedding/event photo website

## Prerequisites

-   A [Pulumi Cloud account](https://www.pulumi.com/docs/pulumi-cloud/get-started/)
-   [Pulumi CLI installed](https://www.pulumi.com/docs/iac/download-install/)
-   An [AWS account](https://aws.amazon.com/)

## Setup ESC for easy AWS access

-   Follow [Configuring AWS OIDC tutorial](https://www.pulumi.com/docs/esc/environments/configuring-oidc/aws/) to setup and identity provider and assign it to a role that has permissions to create AWS resources. I called mine `PulumiOIDC` and gave it built-in `AdministratorAccess` policy.
-   Create a new [ESC environment](https://www.pulumi.com/docs/esc/get-started/) called `creds/aws` and paste below ESC yaml

```
values:
  aws:
    login:
      fn::open::aws-login:
        oidc:
          duration: 1h
          roleArn: <Paste in ARN of your newly created role>
          sessionName: pulumi-environments-session
          subjectAttributes:
            - currentEnvironment.name
            - pulumi.user.login
  environmentVariables:
    AWS_ACCESS_KEY_ID: ${aws.login.accessKeyId}
    AWS_SECRET_ACCESS_KEY: ${aws.login.secretAccessKey}
    AWS_SESSION_TOKEN: ${aws.login.sessionToken}
```

-   This environment will log you into AWS with short lived credentials and allow your Pulumi program to create AWS resources without the need to setup AWS CLI or credentials locally

## Create a new stack

-   Navigate into the `infra` directory using `cd infra`
-   Create a new stack configuration file named `Pulumi.dev.yaml` and fill it with the below values:

```
environment:
    - creds/aws
config:
    aws:region: us-west-2
    PhotoUploadSite:websitePassword: 1337
    PhotoUploadSite:serviceName: party-photos-webapp
    PhotoUploadSite:websiteTitle: Bob & Alice
    PhotoUploadSite:websiteDescription: Welcome to Bob and Alice gallery!<br>Have fun coding with Pulumi!
```

-   The first part imports the environment with AWS credentials we created earlier
-   The second part configures the website itself with:
    -   `websitePassword` - a query parameter that needs to be passed in when visiting the page. This is a simple way to keep out random visitors from your private photos
    -   `serviceName` - name for the AppRunner service, this way you can easily identify it in AWS console
    -   `websiteTitle` - the main title on the website. Generally you want the couple's names
    -   `websiteDescription` - supporting text for the website, write in a greeting or something similar
-   Run `pulumi up -s dev` and follow the prompts. The website will build and deploy into your AWS account.
-   Once the stack is created, one of the outputs will be the `websiteUrl` that you can use to navigate to your new website
-   Make sure to add the password parameter, so the final URL will look like this: `https://$websiteUrl?password=$password`
-   Once you verify that it works, create a QR code from the URL above and post it around your event!

# Technical details

## Summary

The Pulumi program inside the `infra` folder essentially creates an S3 bucket and a webapp to interface with it. The webapp's source code is in the `webapp` folder, it is a simple Next.JS app, with one page and 2 API endpoints to proxy images through. During the program execution the webapp is built, containerized and uploaded into an ECR registry, to be hosted using AWS AppRunner.
The website itself retrieves the image links through a `/photos` GET API and displays them. It also has a single `Upload` button that lets users upload the images via `/photos` POST API endpoint. Both endpoints require a query parameter `password` which creates a very simple authorization to allow only users with the right URL to use the website. A few weeks/months after the event, you can download all the images from the S3 bucket, and run `pulumi destroy` to remove the whole stack of resources.

## AWS resources created

-   An S3 bucket and various policies to make the photos in it accessible to read by the browser
-   An IAM user scoped down to only read and write the photo bucket - this user is used by the website
-   An ECR repository to upload the webapp's docker images into
-   An AppRunner Service that runs said images and creates a publicly accessible URL for the server

## Technologies used

-   Typescript
-   Next.JS
-   Docker
-   Pulumi IaC
-   Pulumi ESC
-   AWS Cloud Resources
