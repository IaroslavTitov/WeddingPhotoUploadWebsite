import * as esc from "@pulumi/esc-sdk";

interface SecretBundle {
    PHOTO_BUCKET_NAME: string;
    WEB_USER_ACCESS_KEY: string;
    WEB_USER_SECRET_KEY: string;
    WEB_GATE_PASSWORD: string;
}

export abstract class EscHelper {
    static secrets: SecretBundle | null = null;

    static async loadSecrets(): Promise<SecretBundle> {
        if (this.secrets) {
            return this.secrets;
        }

        const PULUMI_ACCESS_TOKEN = process.env.PULUMI_ACCESS_TOKEN!;
        const orgName = process.env.PULUMI_ORG!;
        const projName = process.env.PULUMI_PROJECT!;
        const envName = process.env.PULUMI_ENV!;
        const config = new esc.Configuration({ accessToken: PULUMI_ACCESS_TOKEN });
        const client = new esc.EscApi(config);

        const openEnv = await client.openAndReadEnvironment(orgName, projName, envName);
        if (!openEnv) {
            throw Error("Failed to open and read the environment");
        }

        this.secrets = {
            PHOTO_BUCKET_NAME: openEnv.values!.environmentVariables!.PHOTO_BUCKET_NAME!,
            WEB_USER_ACCESS_KEY: openEnv.values!.environmentVariables!.WEB_USER_ACCESS_KEY!,
            WEB_USER_SECRET_KEY: openEnv.values!.environmentVariables!.WEB_USER_SECRET_KEY!,
            WEB_GATE_PASSWORD: openEnv.values!.environmentVariables!.WEB_GATE_PASSWORD!,
        };

        return this.secrets;
    }
}
