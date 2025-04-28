/* eslint-disable @next/next/no-img-element */
"use client";

import styles from "./page.module.css";
import { UploadResult } from "@/services/s3helper";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";

export default function Home() {
    const [modalSource, setModalSource] = useState<string | undefined>(undefined);
    const [photoLinks, setPhotoLinks] = useState<string[]>([]);
    const [needReload, setNeedReload] = useState<boolean>(true);
    const [unauthorized, setUnauthorized] = useState<boolean>(false);
    const password = useSearchParams().get("password");
    const websiteTitle = process.env.NEXT_PUBLIC_WEBSITE_TITLE;
    const websiteDescription = process.env.NEXT_PUBLIC_WEBSITE_DESCRIPTION!;

    useEffect(() => {
        async function fetchPhotos() {
            const response = await fetch("/api/photos", {
                method: "GET",
                headers: new Headers({
                    Authorization: password ?? "",
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
    }, [needReload, password]);

    const downloadImageFromUrl = async (imageUrl: string) => {
        const split = imageUrl.split("/");
        const filename = split[split.length - 1];
        // I don't know why, but without the query param you get intermittent CORS errors
        // Most likely weird caching logic on AWS side
        const response = await fetch(imageUrl + "?a=1");
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
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
                    Authorization: password ?? "",
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
                        <div className={styles.titleText}>{websiteTitle}</div>
                        <img className={styles.titleImage} src="/images/vignette.png" alt="vignette" />
                    </div>
                    <p className={styles.greeting}>
                        {websiteDescription.split("<br>").map((text, index) => (
                            <React.Fragment key={index}>
                                {text}
                                <br />
                            </React.Fragment>
                        ))}
                    </p>
                    <form className={styles.uploadForm}>
                        <div className={styles.uploadLabel} onClick={startFileSelection}>
                            <img className={styles.uploadLabelImage} src="/images/label.png" alt="label" />
                            <p className={styles.uploadLabelText}>UPLOAD</p>
                        </div>
                        <input className={styles.fileInput} id="photoInput" type="file" accept="image/*" multiple onChange={filesSelected} />
                    </form>
                    {photoLinks.length > 0 && (
                        <div className={styles.photoStorage}>
                            {photoLinks.map((url, index) => (
                                <img className={styles.photoImage} key={index} src={url} alt={"photo " + index} onClick={() => setModalSource(url)} />
                            ))}
                        </div>
                    )}
                    {modalSource && (
                        <div className={styles.modalBox} id="modalBox" onClick={() => setModalSource(undefined)}>
                            <img className={styles.modalImage} alt="modal image" src={modalSource} />
                            <button className={styles.modalButton} onClick={() => downloadImageFromUrl(modalSource)}>
                                Download
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
