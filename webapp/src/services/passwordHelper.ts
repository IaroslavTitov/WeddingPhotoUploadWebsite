import { NextRequest } from "next/server";

export abstract class PasswordHelper {
    static async validatePassword(request: NextRequest): Promise<Response | null> {
        const password = request.headers.get("Authorization");
        if (!password || process.env.WEBSITE_PASSWORD! != password) {
            return new Response("Invalid password", {
                status: 403,
            });
        }
        return null;
    }
}
