"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../components/navbar";
import { supabase } from "../../../../lib/supabaseClient";

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
const [oldImage, setOldImage] = useState("");
const [uploading, setUploading] = useState(false);


  useEffect(() => {
    async function loadPost() {
      const { data } = await supabase
        .from("community")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (data) {
  setTitle(data.title);
  setCategory(data.category);
  setContent(data.content);

  setImage(data.image ?? "");
  setOldImage(data.image ?? "");
}

      setLoading(false);
    }

    if (id) loadPost();
  }, [id]);

  async function deleteCommunityImage(imageUrl: string) {
  if (!imageUrl) return;

  try {
    const url = new URL(imageUrl);
    const path = url.pathname.split("/community-images/")[1];

    if (!path) return;

    const filePath = decodeURIComponent(path);

    const { error } = await supabase.storage
      .from("community-images")
      .remove([filePath]);

    if (error) {
      console.error("Failed to delete old image:", error);
    }
  } catch (error) {
    console.error("Could not process old image URL:", error);
  }
}
  
async function uploadImage(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    alert("Maximum image size is 10MB.");
    return;
  }

  setUploading(true);

  try {
    const img = new Image();
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      img.src = reader.result as string;

      img.onload = async () => {
        const canvas =
          document.createElement("canvas");

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          alert("Could not process image.");
          setUploading(false);
          return;
        }

        const maxSize = 1280;

        let width = img.width;
        let height = img.height;

        if (
          width > height &&
          width > maxSize
        ) {
          height *= maxSize / width;
          width = maxSize;
        }

        if (
          height > width &&
          height > maxSize
        ) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              alert(
                "Could not process image."
              );
              setUploading(false);
              return;
            }

            const filename =
              `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.jpg`;

            const { error: uploadError } =
              await supabase.storage
                .from("community-images")
                .upload(
                  filename,
                  blob,
                  {
                    contentType:
                      "image/jpeg",
                    upsert: false,
                  }
                );

            if (uploadError) {
              alert(
                uploadError.message
              );
              setUploading(false);
              return;
            }

            const { data } =
              supabase.storage
                .from("community-images")
                .getPublicUrl(
                  filename
                );

            // Only change the current
            // preview. The old image stays
            // safe until Save Changes.
            setImage(data.publicUrl);

            setUploading(false);
          },
          "image/jpeg",
          0.75
        );
      };
    };
  } catch (error) {
    console.error(error);
    alert("Failed to upload image.");
    setUploading(false);
  }
}

async function saveChanges() {
  if (uploading) return;

  const { error } = await supabase
    .from("community")
    .update({
      title,
      category,
      content,
      image,
    })
    .eq("id", Number(id));

  if (error) {
    alert(error.message);
    return;
  }

  // Only delete the old image AFTER the
  // database successfully points to the
  // new image.
  if (
    oldImage &&
    oldImage !== image
  ) {
    await deleteCommunityImage(
      oldImage
    );
  }

  // The newly selected image is now
  // the official image.
  setOldImage(image);

  alert("Post updated!");

  router.push(`/community/${id}`);
}

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6">
      <Navbar />

      <section className="max-w-4xl mx-auto pt-24 md:pt-32">

        <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-8 md:mb-10">
          Edit Post
        </h1>

        <div className="space-y-6">

          <select
            value={category}
            onChange={(e)=>setCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 md:p-4"
          >
            <option value="Fan Art">🎨 Fan Art</option>
            <option value="Discussion">💬 Discussion</option>
            <option value="Question">❓ Question</option>
            <option value="Announcement">📢 Announcement</option>
          </select>

          <input
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 md:p-4"
          />

          <textarea
            value={content}
            onChange={(e)=>setContent(e.target.value)}
            rows={10}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 md:p-4"
          />

          <div className="space-y-4">

  <label
  htmlFor="image-upload"
  className="inline-flex items-center gap-2 cursor-pointer
  bg-yellow-500 hover:bg-yellow-400
  text-black font-bold
  px-6 py-3 rounded-xl transition"
>
  📷 Change Image
</label>

<input
  id="image-upload"
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      uploadImage(e.target.files[0]);
    }
  }}
/>

  {uploading && (
    <p className="text-yellow-400">
      Uploading image...
    </p>
  )}

  {image && (
  <img
    src={image}
    alt="Preview"
    className="rounded-2xl border border-yellow-500 max-h-96 w-full object-contain"
  />
)}

</div>

          <button
            onClick={saveChanges}
            className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold transition"
          >
            💾 Save Changes
          </button>

        </div>

      </section>
    </main>
  );
}