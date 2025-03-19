import { PasswordHelper } from "@/services/passwordHelper";
import { S3Helper, UploadResult } from "@/services/s3helper";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const passwordIssue = await PasswordHelper.validatePassword(request);
    if (passwordIssue) {
        return passwordIssue;
    }

    let photoLinks: string[] = [];
    try {
        photoLinks = await S3Helper.listPhotos();
    } catch (e) {
        return new Response("Internal Service Error:" + e, {
            status: 500,
        });
    }

    return new Response(JSON.stringify(photoLinks), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(request: NextRequest) {
    const passwordIssue = await PasswordHelper.validatePassword(request);
    if (passwordIssue) {
        return passwordIssue;
    }

    let uploadResult: UploadResult | null = null;
    try {
        const formData = await request.formData();
        const files: File[] = [];
        for (const value of formData.values()) {
            if (value instanceof File) {
                files.push(value);
            }
        }

        uploadResult = await S3Helper.uploadPhotos(files);
    } catch (e) {
        return new Response("Internal Service Error:" + e, {
            status: 500,
        });
    }

    return new Response(JSON.stringify(uploadResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
