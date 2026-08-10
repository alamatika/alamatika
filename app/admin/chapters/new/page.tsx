"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabaseClient";
import Navbar from "../../../../components/navbar";
import imageCompression from "browser-image-compression";

export default function NewChapter() {
  const router = useRouter();

  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [published, setPublished] = useState(false);
  const [locked, setLocked] = useState(false);

  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pageFiles, setPageFiles] = useState<string[]>([]);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPages, setUploadingPages] = useState(false);

  async function removeStorageFiles(
    bucket: string,
    files: string[]
  ) {
    if (files.length === 0) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove(files);

    if (error) {
      console.error(
        `Failed to clean up ${bucket} files:`,
        error
      );
    }
  }

  async function uploadCover(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadingCover(true);

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1800,
        maxSizeMB: 1,
        useWebWorker: true,
        initialQuality: 0.85,
      });

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeName =
        `chapter-${chapterNumber || "new"}-cover-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("covers")
        .upload(safeName, compressed);

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(safeName);

      setCoverImage(data.publicUrl);

      alert("Cover uploaded!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload cover image.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function removeCover() {
    if (!coverImage) return;

    const fileName = coverImage
      .split("/")
      .pop()
      ?.split("?")[0];

    if (fileName) {
      await removeStorageFiles("covers", [fileName]);
    }

    setCoverImage("");
  }

  async function uploadPages(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) return;

    setUploadingPages(true);

    const uploadedUrls: string[] = [];
    const uploadedFiles: string[] = [];

    try {
      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1800,
          maxSizeMB: 1,
          useWebWorker: true,
          initialQuality: 0.85,
        });

        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const pageNumber =
          uploadedFiles.length + 1;

        const safeName =
          `chapter-${chapterNumber || "new"}-page-${String(
            pageNumber
          ).padStart(2, "0")}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${extension}`;

        const { error } = await supabase.storage
          .from("pages")
          .upload(safeName, compressed);

        if (error) {
          await removeStorageFiles(
            "pages",
            uploadedFiles
          );

          alert(error.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("pages")
          .getPublicUrl(safeName);

        uploadedUrls.push(publicUrl);
        uploadedFiles.push(safeName);
      }

      setPageImages(uploadedUrls);
      setPageFiles(uploadedFiles);

      alert("Pages uploaded!");
    } catch (error) {
      console.error(error);

      await removeStorageFiles(
        "pages",
        uploadedFiles
      );

      alert("Failed to upload manga pages.");
    } finally {
      setUploadingPages(false);

      // Allows selecting the same files again.
      e.target.value = "";
    }
  }

  async function removePage(index: number) {
    const fileName = pageFiles[index];

    if (fileName) {
      await removeStorageFiles("pages", [
        fileName,
      ]);
    }

    setPageImages((current) =>
      current.filter((_, i) => i !== index)
    );

    setPageFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function publishChapter() {
    if (!chapterNumber.trim()) {
      alert("Please enter a chapter number.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a chapter title.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter a chapter description.");
      return;
    }

    if (!coverImage) {
      alert("Please upload a chapter cover.");
      return;
    }

    if (pageImages.length === 0) {
      alert("Please upload at least one manga page.");
      return;
    }

    const chapter = Number(chapterNumber);

    if (!Number.isFinite(chapter) || chapter <= 0) {
      alert("Please enter a valid chapter number.");
      return;
    }

    const { error } = await supabase
      .from("chapters")
      .insert({
        chapter,
        title,
        description,
        pages: pageImages.length,
        cover_image: coverImage,
        page_images: pageImages,
        published,
        locked,
      });

    if (error) {
      console.error(error);

      // Database insert failed, so clean up
      // everything that was uploaded for this chapter.
      await removeStorageFiles(
        "covers",
        coverImage
          ? [
              coverImage
                .split("/")
                .pop()
                ?.split("?")[0] || "",
            ].filter(Boolean)
          : []
      );

      await removeStorageFiles(
        "pages",
        pageFiles
      );

      alert(error.message);
      return;
    }

    alert("Chapter saved!");

    router.push("/admin/chapters");
  }

  const hasTitle = title.trim().length > 0;
  const hasDescription =
    description.trim().length > 0;
  const hasCover = coverImage.length > 0;
  const hasPages = pageImages.length > 0;

  const readyToPublish =
    hasTitle &&
    hasDescription &&
    hasCover &&
    hasPages;

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto pt-32 px-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition mb-8"
        >
          🏠 Creator Studio
        </Link>

        <Link
          href="/admin/chapters"
          className="block mb-8 text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to Chapters
        </Link>

        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
          New Chapter
        </h1>

        <p className="text-gray-400 mt-3">
          Create the next chapter of ALAMATIKA.
        </p>

        <div className="space-y-6 mt-12">
          {/* CHAPTER INFORMATION */}
          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              📖 Chapter Information
            </h2>

            <div className="space-y-4">
              <input
                type="number"
                placeholder="Chapter Number"
                value={chapterNumber}
                onChange={(e) =>
                  setChapterNumber(e.target.value)
                }
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              />

              <input
                type="text"
                placeholder="Chapter Title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              />

              <textarea
                placeholder="Chapter Description"
                rows={5}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              />
            </div>
          </div>

          {/* COVER */}
          <div className="bg-zinc-900 rounded-2xl p-8">
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

            {uploadingCover && (
              <p className="mt-4 text-yellow-400">
                ⏳ Uploading cover...
              </p>
            )}

            {coverImage && (
              <div className="mt-6">
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  className="w-full max-w-md h-auto rounded-xl object-cover border border-yellow-500"
                />

                <button
                  type="button"
                  onClick={removeCover}
                  className="mt-4 text-red-400 hover:text-red-300 transition"
                >
                  🗑 Remove Cover
                </button>
              </div>
            )}
          </div>

          {/* MANGA PAGES */}
          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              📄 Manga Pages
            </h2>

            <div className="bg-zinc-800 rounded-xl p-4 border border-yellow-500/30">
              <p className="text-yellow-400 font-semibold">
                📄 {pageImages.length} Page
                {pageImages.length !== 1
                  ? "s"
                  : ""}
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

            {uploadingPages && (
              <p className="mt-4 text-yellow-400">
                ⏳ Uploading pages...
              </p>
            )}

            {pageImages.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-500">
                Page previews will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {pageImages.map((url, index) => (
                  <div key={url} className="relative">
                    <Image
                      src={url}
                      alt={`Page ${index + 1}`}
                      width={250}
                      height={350}
                      className="rounded-lg border border-zinc-700 object-cover w-full"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removePage(index)
                      }
                      className="mt-2 text-red-400 hover:text-red-300 transition"
                    >
                      🗑 Remove Page
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PUBLISHING */}
          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              ⚙ Publishing
            </h2>

            <div className="space-y-4">
              <select
                value={
                  locked ? "PREMIUM" : "FREE"
                }
                onChange={(e) =>
                  setLocked(
                    e.target.value === "PREMIUM"
                  )
                }
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              >
                <option value="FREE">
                  FREE
                </option>
                <option value="PREMIUM">
                  PREMIUM
                </option>
              </select>

              <select
                value={
                  published
                    ? "Published"
                    : "Draft"
                }
                onChange={(e) =>
                  setPublished(
                    e.target.value ===
                      "Published"
                  )
                }
                className="w-full bg-zinc-900 rounded-xl p-4 border border-yellow-500/30"
              >
                <option value="Draft">
                  Draft
                </option>
                <option value="Published">
                  Published
                </option>
              </select>
            </div>
          </div>

          {/* CHECKLIST */}
          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              ✅ Publishing Checklist
            </h2>

            <div
              className={`rounded-xl p-5 text-center font-bold text-xl ${
                readyToPublish
                  ? "bg-green-900 border border-green-500 text-green-300"
                  : "bg-red-900 border border-red-500 text-red-300"
              }`}
            >
              {readyToPublish
                ? "✅ Ready to Save"
                : "⚠ Needs Attention"}
            </div>

            <div className="space-y-3 mt-6">
              <p>
                {hasTitle ? "✅" : "❌"} Chapter title
              </p>

              <p>
                {hasDescription
                  ? "✅"
                  : "❌"}{" "}
                Description
              </p>

              <p>
                {hasCover ? "✅" : "❌"} Cover image
              </p>

              <p>
                {hasPages ? "✅" : "❌"}{" "}
                {pageImages.length} Manga Page
                {pageImages.length !== 1
                  ? "s"
                  : ""}
              </p>

              <p>
                ✅{" "}
                {locked
                  ? "PREMIUM"
                  : "FREE"}
              </p>

              <p>
                {published
                  ? "🟢 Published"
                  : "🟡 Draft"}
              </p>
            </div>
          </div>

          {/* SAVE */}
          <button
            type="button"
            onClick={publishChapter}
            disabled={
              !readyToPublish ||
              uploadingCover ||
              uploadingPages
            }
            className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 Save Chapter
          </button>

          {/* TIPS */}
          <div className="bg-zinc-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              💡 Publishing Tips
            </h2>

            <ul className="mt-4 space-y-2 text-gray-300 list-disc list-inside">
              <li>
                Use a high-quality chapter cover.
              </li>
              <li>
                Make sure pages are in the correct
                order.
              </li>
              <li>
                Double-check dialogue before
                publishing.
              </li>
              <li>
                Preview the chapter before releasing
                it.
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
    </main>
  );
}