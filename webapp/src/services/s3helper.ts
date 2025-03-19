import { EscHelper } from "./escHelper";
import * as crypto from "node:crypto";
import { _Object, ListObjectsV2Command, PutObjectCommand, PutObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";

export interface UploadResult {
    successCount: number;
    failCount: number;
}

export abstract class S3Helper {
    static s3Client: S3Client;
    static REGION: string = "us-west-2";

    static async getS3Client() {
        if (this.s3Client) {
            return this.s3Client;
        }

        await EscHelper.loadSecrets();

        this.s3Client = new S3Client({
            region: S3Helper.REGION,
            credentials: { accessKeyId: EscHelper.secrets!.WEB_USER_ACCESS_KEY, secretAccessKey: EscHelper.secrets!.WEB_USER_SECRET_KEY },
        });
        return this.s3Client;
    }

    static async uploadPhotos(files: File[]): Promise<UploadResult> {
        const s3Client = await S3Helper.getS3Client();

        const promises: Promise<PutObjectCommandOutput | null>[] = [];
        let failCount = 0;
        for (const file of files) {
            const randomString = crypto.randomBytes(20).toString("hex");
            const fileFormat = file.type.split("/")[1];
            const fileName = randomString + "." + fileFormat;
            const fileBytes = await file.bytes();

            const putRequest = new PutObjectCommand({
                Key: fileName,
                Body: fileBytes,
                ContentLength: fileBytes.length,
                ContentType: file.type,
                Bucket: EscHelper.secrets!.PHOTO_BUCKET_NAME,
            });
            const upload = s3Client.send(putRequest);

            const promise = upload.catch((error) => {
                console.log("Failed to upload picture due to error: " + error);
                failCount++;
                return null;
            });
            promises.push(promise);
        }

        const uploads = await Promise.allSettled(promises);
        const successCount = uploads.length - failCount;

        return {
            successCount,
            failCount,
        };
    }

    static async listPhotos(): Promise<string[]> {
        const s3Client = await S3Helper.getS3Client();
        try {
            let continuationToken = undefined;
            let allObjects: _Object[] = [];

            do {
                const command: ListObjectsV2Command = new ListObjectsV2Command({
                    Bucket: EscHelper.secrets!.PHOTO_BUCKET_NAME,
                    ContinuationToken: continuationToken,
                });

                const response = await s3Client.send(command);

                if (response.Contents) {
                    allObjects = allObjects.concat(response.Contents);
                }

                continuationToken = response.NextContinuationToken;
            } while (continuationToken);

            return allObjects.map(
                (o) => `https://${EscHelper.secrets!.PHOTO_BUCKET_NAME}.s3.${S3Helper.REGION}.amazonaws.com/${encodeURIComponent(o.Key!)}`,
            );
        } catch (error) {
            console.error("Error listing S3 objects:", error);
            return [];
        }
    }
}
