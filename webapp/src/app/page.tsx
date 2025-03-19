"use client";

import styles from "./page.module.css";
import { UploadResult } from "@/services/s3helper";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
    const [photoLinks, setPhotoLinks] = useState<string[]>([]);
    const [needReload, setNeedReload] = useState<boolean>(true);
    const [unauthorized, setUnauthorized] = useState<boolean>(false);
    const searchParams = useSearchParams();

    const filesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const formData = new FormData();
            Array.from(files).forEach((file, index) => {
                formData.append(index.toString(), file);
            });

            const response = await fetch("/api/photos", {
                method: "POST",
                headers: new Headers({
                    Authorization: searchParams.get("password") ?? "",
                }),
                body: formData,
            });

            if (response.ok) {
                const body: UploadResult = await response.json();
                if (body.failCount > 0 || body.successCount == 0) {
                    console.warn(`Uploaded ${body.successCount} photos successfully, but ${body.failCount} failed!`);
                } else {
                    console.log(`Uploaded ${body.successCount} photos successfully!`);
                }
                setNeedReload(!needReload);
            } else {
                console.error(`Upload failed due to` + (await response.text()));
            }
        }
    };

    useEffect(() => {
        async function fetchPhotos() {
            const response = await fetch("/api/photos", {
                method: "GET",
                headers: new Headers({
                    Authorization: searchParams.get("password") ?? "",
                }),
            });
            if (response.ok) {
                setPhotoLinks(await response!.json());
            } else {
                if (response.status == 403) {
                    setUnauthorized(true);
                }
                console.log("Failed to load photos, due to: " + (await response.text));
            }
        }
        fetchPhotos();
    }, [needReload, searchParams]);

    return (
        <div className={styles.root}>
            {unauthorized ? (
                <h1>Unauthorized!</h1>
            ) : (
                <>
                    <h1>Iaro and Tori&apos;s Wedding Pics</h1>
                    <form>
                        <div>
                            Select a file:
                            <input id="photos-input" type="file" accept="image/*" multiple onChange={filesSelected} />
                        </div>
                    </form>
                    <div>
                        {photoLinks.map((url, index) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={index} src={url} alt={"photo " + index} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
