import { NextRequest } from "next/server";
import { EscHelper } from "./escHelper";

export abstract class PasswordHelper {
    static async validatePassword(request: NextRequest): Promise<Response | null> {
        const secrets = await EscHelper.loadSecrets();
        const password = request.headers.get("Authorization");
        if (!password || secrets.WEB_GATE_PASSWORD != password) {
            return new Response("Invalid password", {
                status: 403,
            });
        }
        return null;
    }
}
