"use client";

import CreatorGuard from "../../../../components/CreatorGuard";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Navbar from "../../../../components/navbar";
import imageCompression from "browser-image-compression";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

export default function EditChapter() {
  const { id } = useParams();
  const chapterId = Number(id);
  const router = useRouter();

  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pagePaths, setPagePaths] =
  useState<string[]>([]);

  const [published, setPublished] = useState(false);
  const [locked, setLocked] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveUrl, setLeaveUrl] = useState("");

  /*
   * Extract the actual Supabase Storage path from a public URL.
   *
   * Example:
   * https://xxxxx.supabase.co/storage/v1/object/public/pages/chapter-5-page.jpg
   *
   * returns:
   * chapter-5-page.jpg
   */
  function getStoragePath(
    publicUrl: string,
    bucket: "covers" | "pages"
  ) {
    if (!publicUrl) return null;

    try {
      const url = new URL(publicUrl);

      const marker = `/storage/v1/object/public/${bucket}/`;

      const index = url.pathname.indexOf(marker);

      if (index === -1) {
        return null;
      }

      const path = url.pathname.substring(
        index + marker.length
      );

      return decodeURIComponent(path);
    } catch {
      return null;
    }
  }

  /*
   * Delete one file from Supabase Storage.
   */
  async function removeStorageFile(
    publicUrl: string,
    bucket: "covers" | "pages"
  ) {
    const path = getStoragePath(publicUrl, bucket);

    if (!path) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error(
        `Failed to delete ${bucket} file:`,
        error
      );
    }
  }

  async function removePremiumPage(
  path: string
) {
  if (!path) return;

  try {
    const response = await fetch(
      "/api/creator/premium-page-delete",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          path,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Premium page cleanup failed:",
        result?.error
      );
    }
  } catch (error) {
    console.error(
      "Premium page cleanup error:",
      error
    );
  }
}

  async function removePublicPage(
  path: string
) {
  if (!path) return;

  const { error } =
    await supabase.storage
      .from("pages")
      .remove([path]);

  if (error) {
    console.error(
      "Failed to clean up public page:",
      error
    );
  }
}

  /*
   * Upload a new chapter cover.
   *
   * The new file is uploaded first.
   * Only after it succeeds do we delete the old cover.
   */
  async function uploadCover(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1800,
        maxSizeMB: 1,
        useWebWorker: true,
        initialQuality: 0.85,
      });

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName =
        `chapter-${chapterNumber}-cover-${crypto.randomUUID()}.${extension}`;

      /*
       * Instant local preview while uploading.
       */
      const previewUrl = URL.createObjectURL(file);
      setCoverImage(previewUrl);

      const { error } = await supabase.storage
        .from("covers")
        .upload(fileName, compressed);

      if (error) {
        setUploading(false);
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);

      const newCoverUrl = data.publicUrl;

      /*
       * Save old URL before replacing it.
       */
      const oldCoverUrl = coverImage;

      setCoverImage(newCoverUrl);
      setHasUnsavedChanges(true);
      setUploading(false);

      /*
       * Delete the old cover after the new one exists.
       */
      if (
        oldCoverUrl &&
        oldCoverUrl.startsWith("http")
      ) {
        await removeStorageFile(
          oldCoverUrl,
          "covers"
        );
      }

      alert("Cover uploaded!");
    } catch (error) {
      console.error(error);
      setUploading(false);
      alert("Something went wrong while uploading the cover.");
    }

    e.target.value = "";
  }

  /*
   * Upload additional manga pages.
   *
   * IMPORTANT:
   * Existing pages are preserved.
   * New pages are appended to the existing array.
   */
  async function uploadPages(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const files = e.target.files;

  if (!files || files.length === 0) return;

  const newlyUploaded: {
      bucket: "pages" | "premium-pages";
      path: string;
    }[] = [];

  try {
    setUploading(true);
    setUploadProgress(0);
    setTotalUploads(files.length);

    const updatedPages = [...pageImages];
    const updatedPaths = [...pagePaths];

    for (const file of Array.from(files)) {
      const compressed =
        await imageCompression(file, {
          maxWidthOrHeight: 1800,
          maxSizeMB: 2,
          useWebWorker: true,
          initialQuality: 0.95,
        });

      const pageNumber =
        updatedPages.length + 1;

      /*
       * PREMIUM CHAPTER
       */
      if (locked) {
        const formData =
          new FormData();

        formData.append(
          "file",
          compressed
        );

        formData.append(
          "chapterNumber",
          chapterNumber
        );

        formData.append(
          "pageNumber",
          String(pageNumber)
        );

        const response = await fetch(
          "/api/creator/premium-page-upload",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ??
              "Failed to upload premium page."
          );
        }

        updatedPages.push(
          result.previewUrl
        );

        updatedPaths.push(
          result.path
        );

        newlyUploaded.push({
          bucket: "premium-pages",
          path: result.path,
        });

      } else {
        /*
         * FREE CHAPTER
         */
        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `chapter-${chapterNumber}-page-${String(
            pageNumber
          ).padStart(
            2,
            "0"
          )}-${crypto.randomUUID()}.${extension}`;

        const previewUrl =
          URL.createObjectURL(file);

        updatedPages.push(
          previewUrl
        );

        setPageImages([
          ...updatedPages,
        ]);

        const { error } =
          await supabase.storage
            .from("pages")
            .upload(
              fileName,
              compressed
            );

        if (error) {
          throw new Error(
            error.message
          );
        }

        const { data } =
          supabase.storage
            .from("pages")
            .getPublicUrl(
              fileName
            );

        updatedPages[
          updatedPages.length - 1
        ] = data.publicUrl;

        updatedPaths.push(
          data.publicUrl
        );

        newlyUploaded.push({
          bucket: "pages",
          path: fileName,
        });
      }

      setPageImages([
        ...updatedPages,
      ]);

      setPagePaths([
        ...updatedPaths,
      ]);

      setUploadProgress(
        (previous) =>
          previous + 1
      );
    }

    setHasUnsavedChanges(true);
    setUploading(false);

    alert(
      locked
        ? "Premium pages uploaded!"
        : "Pages uploaded!"
    );

  } catch (error) {
    console.error(
      "Upload pages error:",
      error
    );

    /*
     * Clean up anything uploaded during
     * this attempt.
     */
    for (const uploaded of newlyUploaded) {
      if (
        uploaded.bucket ===
        "premium-pages"
      ) {
        await removePremiumPage(
          uploaded.path
        );
      } else {
        await removePublicPage(
  uploaded.path
);
      }
    }

    setUploading(false);

    alert(
      error instanceof Error
        ? error.message
        : "Something went wrong while uploading the pages."
    );

  } finally {
    e.target.value = "";
  }
}

  /*
   * Reorder pages.
   *
   * This ONLY changes the order of the URLs.
   * It does not rename or delete Storage files.
   */
  function handleDragEnd(result: DropResult) {
  if (!result.destination) return;

  const imageItems = Array.from(
    pageImages
  );

  const pathItems = Array.from(
    pagePaths
  );

  const [reorderedImage] =
    imageItems.splice(
      result.source.index,
      1
    );

  const [reorderedPath] =
    pathItems.splice(
      result.source.index,
      1
    );

  imageItems.splice(
    result.destination.index,
    0,
    reorderedImage
  );

  pathItems.splice(
    result.destination.index,
    0,
    reorderedPath
  );

  setPageImages(imageItems);
  setPagePaths(pathItems);

  setHasUnsavedChanges(true);
}

  /*
   * Delete a single manga page.
   */
  async function deletePage(index: number) {
  const confirmed = window.confirm(
    `Delete Page ${index + 1}?`
  );

  if (!confirmed) return;

  const imageUrl = pageImages[index];
  const pagePath = pagePaths[index];

  if (!pagePath) {
    alert("Could not find the page storage path.");
    return;
  }

  /*
   * PREMIUM PAGE
   * Private storage path → secure Creator API.
   */
  if (
    !pagePath.startsWith("http")
  ) {
    try {
      const response = await fetch(
        "/api/creator/premium-page-delete",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            path: pagePath,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result?.error ??
            "Failed to delete premium page."
        );
        return;
      }
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete premium page."
      );
      return;
    }
  }

  /*
   * FREE / PUBLIC PAGE
   */
  else if (imageUrl) {
    await removeStorageFile(
      imageUrl,
      "pages"
    );
  }

  /*
   * Keep image previews and storage paths
   * synchronized.
   */
  const updatedPages =
    pageImages.filter(
      (_, i) => i !== index
    );

  const updatedPaths =
    pagePaths.filter(
      (_, i) => i !== index
    );

  setPageImages(updatedPages);
  setPagePaths(updatedPaths);
  setHasUnsavedChanges(true);
}

  /*
   * Replace one manga page.
   *
   * New file is uploaded first.
   * Old file is deleted only after the new file succeeds.
   */
  async function replacePage(
  index: number,
  file: File
) {
  try {
    const oldImageUrl =
      pageImages[index];

    const oldPagePath =
      pagePaths[index];

    if (!oldPagePath) {
      alert(
        "Could not find the existing page storage path."
      );
      return;
    }

    const compressed =
      await imageCompression(file, {
        maxWidthOrHeight: 1800,
        maxSizeMB: 2,
        useWebWorker: true,
        initialQuality: 0.95,
      });

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    /*
     * PREMIUM PAGE
     */
    if (
      !oldPagePath.startsWith("http")
    ) {
      const formData =
        new FormData();

      formData.append(
        "file",
        compressed
      );

      formData.append(
        "chapterNumber",
        chapterNumber
      );

      formData.append(
        "pageNumber",
        String(index + 1)
      );

      const response = await fetch(
        "/api/creator/premium-page-upload",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result?.error ??
            "Failed to replace premium page."
        );
        return;
      }

      /*
       * New premium file exists.
       * Now delete the old private file.
       */
      const deleteResponse =
        await fetch(
          "/api/creator/premium-page-delete",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              path: oldPagePath,
            }),
          }
        );

      const deleteResult =
        await deleteResponse.json();

      if (!deleteResponse.ok) {
        console.error(
          "Old premium page deletion failed:",
          deleteResult?.error
        );
      }

      const updatedPages = [
        ...pageImages,
      ];

      const updatedPaths = [
        ...pagePaths,
      ];

      updatedPages[index] =
        result.previewUrl;

      updatedPaths[index] =
        result.path;

      setPageImages(
        updatedPages
      );

      setPagePaths(
        updatedPaths
      );

      setHasUnsavedChanges(
        true
      );

      alert(
        `Page ${index + 1} replaced!`
      );

      return;
    }

    /*
     * FREE / PUBLIC PAGE
     */
    const fileName =
      `chapter-${chapterNumber}-page-${String(
        index + 1
      ).padStart(
        2,
        "0"
      )}-${crypto.randomUUID()}.${extension}`;

    const { error } =
      await supabase.storage
        .from("pages")
        .upload(
          fileName,
          compressed
        );

    if (error) {
      alert(error.message);
      return;
    }

    const { data } =
      supabase.storage
        .from("pages")
        .getPublicUrl(
          fileName
        );

    const updatedPages = [
      ...pageImages,
    ];

    const updatedPaths = [
      ...pagePaths,
    ];

    updatedPages[index] =
      data.publicUrl;

    updatedPaths[index] =
      data.publicUrl;

    setPageImages(
      updatedPages
    );

    setPagePaths(
      updatedPaths
    );

    setHasUnsavedChanges(
      true
    );

    /*
     * Delete old public file only
     * after new upload succeeds.
     */
    if (
      oldPagePath.startsWith("http")
    ) {
      await removeStorageFile(
        oldPagePath,
        "pages"
      );
    }

    alert(
      `Page ${index + 1} replaced!`
    );

  } catch (error) {
    console.error(error);

    alert(
      "Something went wrong while replacing the page."
    );
  }
}

 async function replaceAllPages(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const files = e.target.files;

  if (!files || files.length === 0) return;

  const selectedFiles = Array.from(files);

  const confirmed = window.confirm(
    `Replace all ${pageImages.length} existing pages with ${selectedFiles.length} new pages?`
  );

  if (!confirmed) {
    e.target.value = "";
    return;
  }

  const uploadedFiles: {
    bucket: "pages" | "premium-pages";
    path: string;
  }[] = [];

  try {
    setUploading(true);
    setUploadProgress(0);
    setTotalUploads(
      selectedFiles.length
    );

    const oldPaths = [...pagePaths];

    const newPages: string[] = [];
    const newPaths: string[] = [];

    // ----------------------------------------
    // 1. Upload ALL new pages first
    // ----------------------------------------

    for (
      let i = 0;
      i < selectedFiles.length;
      i++
    ) {
      const file = selectedFiles[i];

      const compressed =
        await imageCompression(file, {
          maxWidthOrHeight: 1800,
          maxSizeMB: 2,
          useWebWorker: true,
          initialQuality: 0.95,
        });

      const pageNumber = i + 1;

      // ----------------------------------------
      // PREMIUM
      // ----------------------------------------

      if (locked) {
        const formData =
          new FormData();

        formData.append(
          "file",
          compressed
        );

        formData.append(
          "chapterNumber",
          chapterNumber
        );

        formData.append(
          "pageNumber",
          String(pageNumber)
        );

        const response = await fetch(
          "/api/creator/premium-page-upload",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ??
              `Failed to upload premium page ${pageNumber}.`
          );
        }

        newPages.push(
          result.previewUrl
        );

        newPaths.push(
          result.path
        );

        uploadedFiles.push({
          bucket: "premium-pages",
          path: result.path,
        });

      } else {
        // ----------------------------------------
        // FREE
        // ----------------------------------------

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `chapter-${chapterNumber}-page-${String(
            pageNumber
          ).padStart(
            2,
            "0"
          )}-${crypto.randomUUID()}.${extension}`;

        const { error } =
          await supabase.storage
            .from("pages")
            .upload(
              fileName,
              compressed
            );

        if (error) {
          throw new Error(
            error.message
          );
        }

        const { data } =
          supabase.storage
            .from("pages")
            .getPublicUrl(
              fileName
            );

        newPages.push(
          data.publicUrl
        );

        newPaths.push(
          data.publicUrl
        );

        uploadedFiles.push({
          bucket: "pages",
          path: fileName,
        });
      }

      setUploadProgress(
        i + 1
      );
    }

    // ----------------------------------------
    // 2. Replace local arrays
    // ----------------------------------------

    setPageImages(newPages);
    setPagePaths(newPaths);
    setHasUnsavedChanges(true);

    // ----------------------------------------
    // 3. Delete OLD pages
    // ----------------------------------------

    for (const oldPath of oldPaths) {
      if (!oldPath) continue;

      if (
        oldPath.startsWith("http")
      ) {
        await removePublicPage(
          getStoragePath(
            oldPath,
            "pages"
          ) ?? ""
        );
      } else {
        await removePremiumPage(
          oldPath
        );
      }
    }

    setUploading(false);

    alert(
      `All pages replaced successfully! ${newPages.length} pages uploaded.`
    );
  } catch (error) {
    console.error(
      "Replace all pages error:",
      error
    );

    // Clean up newly uploaded files
    // if anything failed.
    for (const uploaded of uploadedFiles) {
      if (
        uploaded.bucket ===
        "premium-pages"
      ) {
        await removePremiumPage(
          uploaded.path
        );
      } else {
        await removePublicPage(
          uploaded.path
        );
      }
    }

    setUploading(false);

    alert(
      error instanceof Error
        ? error.message
        : "Something went wrong while replacing all pages."
    );
  }

  e.target.value = "";
}

  /*
   * Load chapter from Supabase.
   */
  useEffect(() => {
    async function loadChapter() {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("id", chapterId)
        .single();

      if (error || !data) {
        alert("Chapter not found.");
        return;
      }

      setChapterNumber(
        data.chapter?.toString() ?? ""
      );

      setTitle(data.title ?? "");
      setDescription(data.description ?? "");

      setCoverImage(
        data.cover_image ?? ""
      );

      const storedPages = Array.isArray(
  data.page_images
)
  ? data.page_images
  : [];

const displayPages: string[] = [];
const storedPaths: string[] = [];

for (const page of storedPages) {
  if (
    typeof page !== "string" ||
    !page.trim()
  ) {
    continue;
  }

  // Existing public page.
  if (page.startsWith("http")) {
    displayPages.push(page);
    storedPaths.push(page);
    continue;
  }

  // Private premium page.
  storedPaths.push(page);

  try {
    const response = await fetch(
      "/api/creator/premium-page-url",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          path: page,
        }),
        cache: "no-store",
      }
    );

    const result =
      await response.json();

    if (
      response.ok &&
      result?.signedUrl
    ) {
      displayPages.push(
        result.signedUrl
      );
    } else {
      console.error(
        "Premium page preview failed:",
        result?.error
      );
    }
  } catch (error) {
    console.error(
      "Premium page preview error:",
      error
    );
  }
}

setPagePaths(storedPaths);
setPageImages(displayPages);

      setPublished(
        Boolean(data.published)
      );

      setLocked(
        Boolean(data.locked)
      );
    }

    if (!isNaN(chapterId)) {
      loadChapter();
    }
  }, [chapterId]);

  /*
   * Browser warning when leaving with unsaved changes.
   */
  useEffect(() => {
    const handleBeforeUnload = (
      e: BeforeUnloadEvent
    ) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [hasUnsavedChanges]);

  /*
   * Save chapter metadata and image URLs.
   */
  async function saveChapter() {
  const { error } = await supabase
    .from("chapters")
    .update({
      chapter: Number(chapterNumber),
      title,
      description,
      pages: pagePaths.length,
      cover_image: coverImage,
      page_images: pagePaths,
      published,
      locked,
    })
    .eq("id", chapterId);

  if (error) {
    alert(error.message);
    return;
  }

  alert(
    "Chapter updated successfully!"
  );

  setHasUnsavedChanges(false);

  router.push(
    "/creator/chapters"
  );
}

  /*
   * Delete the entire chapter AND all of its Storage files.
   */
  async function deleteChapter() {
  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this chapter?"
  );

  if (!confirmed) return;

  try {
    /*
     * Get the latest chapter data first.
     */
    const { data: chapter, error: fetchError } =
      await supabase
        .from("chapters")
        .select(
          "cover_image, page_images"
        )
        .eq("id", chapterId)
        .single();

    if (fetchError || !chapter) {
      alert(
        fetchError?.message ??
          "Chapter not found."
      );
      return;
    }

    /*
     * Delete cover.
     */
    if (
      chapter.cover_image &&
      chapter.cover_image.startsWith("http")
    ) {
      await removeStorageFile(
        chapter.cover_image,
        "covers"
      );
    }

    /*
     * Delete every manga page.
     */
    const pagesToDelete =
      Array.isArray(chapter.page_images)
        ? chapter.page_images
        : [];

    for (const pagePath of pagesToDelete) {
      if (
        typeof pagePath !== "string" ||
        !pagePath
      ) {
        continue;
      }

      /*
       * PREMIUM PAGE
       * Private storage path.
       */
      if (
        !pagePath.startsWith("http")
      ) {
        const response = await fetch(
          "/api/creator/premium-page-delete",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              path: pagePath,
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ??
              `Failed to delete premium page: ${pagePath}`
          );
        }

        continue;
      }

      /*
       * FREE / PUBLIC PAGE
       */
      await removeStorageFile(
        pagePath,
        "pages"
      );
    }

    /*
     * Finally delete the database record.
     */
    const { error: deleteError } =
      await supabase
        .from("chapters")
        .delete()
        .eq("id", chapterId);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    alert(
      "Chapter and its Storage files were deleted!"
    );

    setHasUnsavedChanges(false);

    router.push(
      "/creator/chapters"
    );
  } catch (error) {
    console.error(
      "Delete chapter error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Something went wrong while deleting the chapter."
    );
  }
}

  /*
   * Protect navigation when there are unsaved changes.
   */
  function tryLeave(url: string) {
    if (hasUnsavedChanges) {
      setLeaveUrl(url);
      setShowLeaveDialog(true);
      return;
    }

    router.push(url);
  }

  /*
   * Publishing checklist.
   */
  const hasTitle =
    title.trim().length > 0;

  const hasDescription =
    description.trim().length > 0;

  const hasCover =
    coverImage.trim().length > 0;

  const hasPages =
    pageImages.length > 0;

  return (
    <CreatorGuard>
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto pt-32 px-6">

        <button
          onClick={() => tryLeave("/creator")}
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
        >
          🏠 Creator Studio
        </button>

        <button
          onClick={() =>
            tryLeave("/creator/chapters")
          }
          className="inline-block mb-8 text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to Chapters
        </button>

        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
          Edit Chapter
        </h1>

        <p className="text-gray-400 mt-3">
          Create the next chapter of ALAMATIKA.
        </p>

        <div className="space-y-6 mt-12">

          {/* CHAPTER INFORMATION */}

          <div className="bg-zinc-900 rounded-2xl p-8 mt-8">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              📖 Chapter Information
            </h2>

            <input
              type="number"
              placeholder="Chapter Number"
              value={chapterNumber}
              onChange={(e) => {
                setChapterNumber(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
            />

          </div>

          <input
            type="text"
            placeholder="Chapter Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
          />

          <textarea
            placeholder="Chapter Description"
            rows={5}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
          />

          {/* COVER */}

          <div className="bg-zinc-900 rounded-2xl p-8 mt-8">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              🖼 Chapter Cover
            </h2>

            <label className="inline-block w-full sm:w-auto text-center cursor-pointer bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition">

              📤 Choose Cover Image

              <input
                type="file"
                accept="image/*"
                onChange={uploadCover}
                className="hidden"
              />

            </label>

            {uploading && (
              <p className="mt-4 text-yellow-400">
                ⏳ Uploading cover...
              </p>
            )}

            {coverImage && (
              <div className="mt-6">

                <img
                  src={coverImage}
                  alt="Preview"
                  className="h-72 w-auto rounded-xl object-cover"
                />

              </div>
            )}

          </div>

          {/* MANGA PAGES */}

          <div className="bg-zinc-900 rounded-2xl p-8 mt-8">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              📄 Manga Pages
            </h2>

            <div className="bg-zinc-800 rounded-xl p-4 border border-yellow-500/30">

              <p className="text-yellow-400 font-semibold">
                📄 {pageImages.length} Page
                {pageImages.length !== 1 ? "s" : ""}
              </p>

            </div>

            <label className="inline-block cursor-pointer bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition mt-6">

              📤 Upload Manga Pages

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={uploadPages}
                className="hidden"
              />

            </label>

            <label
  className={`inline-block cursor-pointer bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-500 transition mt-4 sm:mt-6 sm:ml-3 ${
    uploading ? "opacity-50 pointer-events-none" : ""
  }`}
>
  🔄 Change All Pages

  <input
    type="file"
    multiple
    accept="image/*"
    onChange={replaceAllPages}
    className="hidden"
    disabled={uploading}
  />
</label>

            <DragDropContext
              onDragEnd={handleDragEnd}
            >

              <Droppable droppableId="pages">

                {(provided) => (

                  <div
                    className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-6"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >

                    {uploading && totalUploads > 0 && (
                      <p className="col-span-2 text-yellow-400 font-semibold">
                        Uploading page {uploadProgress} of{" "}
                        {totalUploads}...
                      </p>
                    )}

                    {pageImages.map(
                      (page, index) => (

                        <Draggable
                          key={page}
                          draggableId={page}
                          index={index}
                        >

                          {(provided) => (

                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="border border-zinc-700 rounded-xl p-2 bg-zinc-900"
                            >

                              <div className="flex justify-between items-center mb-2">

                                <p className="text-yellow-400 font-semibold">
                                  Page {index + 1}
                                </p>

                                <div className="flex gap-2">

                                  {/* REPLACE */}

                                  <label
                                    className="cursor-pointer text-blue-400 hover:text-blue-300 text-xl"
                                    title="Replace page"
                                  >

                                    🔄

                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file =
                                          e.target.files?.[0];

                                        if (file) {
                                          replacePage(
                                            index,
                                            file
                                          );
                                        }

                                        e.target.value = "";
                                      }}
                                    />

                                  </label>

                                  {/* DELETE */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deletePage(index)
                                    }
                                    className="text-red-500 hover:text-red-400 text-xl"
                                    title="Delete page"
                                  >
                                    🗑
                                  </button>

                                </div>

                              </div>

                              <img
                                src={page}
                                alt={`Page ${index + 1}`}
                                className="rounded-lg w-full"
                              />

                            </div>

                          )}

                        </Draggable>

                      )
                    )}

                    {provided.placeholder}

                  </div>

                )}

              </Droppable>

            </DragDropContext>

          </div>

          {/* PUBLISHING */}

          <div className="bg-zinc-900 rounded-2xl p-8 mt-8">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              ⚙ Publishing
            </h2>

            <div className="space-y-4">

              <select
                value={
                  locked
                    ? "PREMIUM"
                    : "FREE"
                }
                onChange={(e) => {
  const newLocked =
    e.target.value === "PREMIUM";

  if (
    newLocked !== locked &&
    pagePaths.length > 0
  ) {
    alert(
      "Please remove all existing manga pages before changing FREE/PREMIUM."
    );
    return;
  }

  setLocked(newLocked);
  setHasUnsavedChanges(true);
}}
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              >

                <option>FREE</option>
                <option>PREMIUM</option>

              </select>

              <select
                value={
                  published
                    ? "Published"
                    : "Draft"
                }
                onChange={(e) => {
                  setPublished(
                    e.target.value === "Published"
                  );

                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              >

                <option>Draft</option>
                <option>Published</option>

              </select>

            </div>

          </div>

          {/* CHECKLIST */}

          <div className="bg-zinc-900 rounded-2xl p-8 mt-8">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              ✅ Publishing Checklist
            </h2>

            <div
              className={`rounded-xl p-5 mt-6 text-center font-bold text-xl ${
                hasTitle &&
                hasDescription &&
                hasCover &&
                hasPages
                  ? "bg-green-900 border border-green-500 text-green-300"
                  : "bg-red-900 border border-red-500 text-red-300"
              }`}
            >

              {hasTitle &&
              hasDescription &&
              hasCover &&
              hasPages
                ? "✅ Ready to Publish"
                : "⚠ Needs Attention"}

            </div>

            <div className="space-y-3 mt-6">

              <p>
                {hasTitle ? "✅" : "❌"} Chapter title
              </p>

              <p>
                {hasDescription ? "✅" : "❌"} Description
              </p>

              <p>
                {hasCover ? "✅" : "❌"} Cover image
              </p>

              <p>
                {hasPages ? "✅" : "❌"}{" "}
                {pageImages.length} Manga Page
                {pageImages.length !== 1 ? "s" : ""}
              </p>

              <p>
                ✅ {locked ? "PREMIUM" : "FREE"}
              </p>

              <p>
                {published
                  ? "🟢 Published"
                  : "🟡 Draft"}
              </p>

            </div>

          </div>

          {/* ACTIONS */}

          <button
            type="button"
            onClick={() =>
              window.open(
                `/read/chapter-${chapterNumber}`,
                "_blank"
              )
            }
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition mb-4"
          >
            👁 Preview Chapter
          </button>

          <button
            type="button"
            onClick={saveChapter}
            className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
          >
            💾 Save Changes
          </button>

          <button
            type="button"
            onClick={deleteChapter}
            className="w-full py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition mt-4"
          >
            🗑 Delete Chapter
          </button>

          {/* TIPS */}

          <div className="bg-zinc-900 rounded-2xl p-8 mt-12">

            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              💡 Publishing Tips
            </h2>

            <ul className="mt-4 space-y-2 text-gray-300 list-disc list-inside">

              <li>
                Use a high-quality chapter cover.
              </li>

              <li>
                Make sure pages are in the correct order.
              </li>

              <li>
                Double-check dialogue before publishing.
              </li>

              <li>
                Preview the chapter before releasing it.
              </li>

            </ul>

          </div>

        </div>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>

      </section>

      {/* UNSAVED CHANGES DIALOG */}

      {showLeaveDialog && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 sm:p-8 w-[calc(100%-2rem)] max-w-[420px] text-center">

            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              ⚠ Unsaved Changes
            </h2>

            <p className="text-gray-300 mb-8">
              You have unsaved changes.
              <br />
              Leave without saving?
            </p>

            <div className="flex flex-col sm:flex-row gap-4">

              <button
                type="button"
                onClick={() =>
                  setShowLeaveDialog(false)
                }
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400"
              >
                Continue Editing
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(leaveUrl)
                }
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500"
              >
                Leave
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
    </CreatorGuard>
  );
}