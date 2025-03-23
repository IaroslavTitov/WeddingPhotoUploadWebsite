/* eslint-disable @next/next/no-img-element */
"use client";

import styles from "./page.module.css";
import { UploadResult } from "@/services/s3helper";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
    const [modalSource, setModalSource] = useState<string | undefined>(undefined);
    const [photoLinks, setPhotoLinks] = useState<string[]>([]);
    const [needReload, setNeedReload] = useState<boolean>(true);
    const [unauthorized, setUnauthorized] = useState<boolean>(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        async function fetchPhotos() {
            const response = await fetch("/api/photos", {
                method: "GET",
                headers: new Headers({
                    Authorization: searchParams.get("password") ?? "",
                }),
            });
            if (response.ok) {
                const links = (await response!.json()) as string[];
                links.sort().reverse();
                setPhotoLinks(links);
            } else {
                if (response.status == 403) {
                    setUnauthorized(true);
                }
                console.log("Failed to load photos, due to: " + (await response.text));
            }
        }
        fetchPhotos();
    }, [needReload, searchParams]);

    const downloadImageFromUrl = (imageUrl: string) => {
        const split = imageUrl.split("/");
        const filename = split[split.length - 1];
        fetch(imageUrl)
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            })
            .catch((error) => console.error("Error downloading image:", error));
    };

    const startFileSelection = () => {
        document.getElementById("photoInput")?.click();
    };

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

    return (
        <div className={styles.root}>
            {unauthorized ? (
                <h1>Unauthorized!</h1>
            ) : (
                <>
                    <div className={styles.title}>
                        <div>Iaro & Tori</div>
                        <img src="/images/vignette.png" alt="vignette" />
                    </div>
                    <p className={styles.greeting}>
                        Welcome to our photo gallery!
                        <br />
                        Here you can upload your pictures from our wedding,
                        <br />
                        to share with us and everyone else!
                        <br />
                    </p>
                    <form>
                        <div className={styles.uploadLabel} onClick={startFileSelection}>
                            <img src="/images/label.png" alt="label" />
                            <p>UPLOAD</p>
                        </div>
                        <input id="photoInput" type="file" accept="image/*" multiple onChange={filesSelected} />
                    </form>
                    {photoLinks.length > 0 && (
                        <div className={styles.photoStorage}>
                            {photoLinks.map((url, index) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={index} src={url} alt={"photo " + index} onClick={() => setModalSource(url)} />
                            ))}
                        </div>
                    )}
                    {modalSource && (
                        <div className={styles.modalBox} id="modalBox" onClick={() => setModalSource(undefined)}>
                            <img alt="modal image" src={modalSource} />
                            <button onClick={() => downloadImageFromUrl(modalSource)}>Download</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
