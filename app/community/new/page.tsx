"use client";

import Navbar from "../../../components/navbar";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NewCommunityPost() {

  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Discussion");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);

  
  async function uploadImage(file: File) {

  if (file.size > 10 * 1024 * 1024) {
    alert("Maximum image size is 10MB.");
    return;
  }

  setUploading(true);

  const img = new Image();
  const reader = new FileReader();

  reader.readAsDataURL(file);

  reader.onload = () => {

    img.src = reader.result as string;

    img.onload = async () => {

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxSize = 1280;

      let width = img.width;
      let height = img.height;

      if (width > height && width > maxSize) {
        height = height * (maxSize / width);
        width = maxSize;
      }

      if (height > width && height > maxSize) {
        width = width * (maxSize / height);
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(async (blob) => {

        if (!blob) return;

        const filename = `${Date.now()}.jpg`;

        const { error } = await supabase.storage
          .from("community-images")
          .upload(filename, blob);

        if (error) {
          alert(error.message);
          setUploading(false);
          return;
        }

        const { data } = supabase.storage
          .from("community-images")
          .getPublicUrl(filename);

        setImage(data.publicUrl);

        setUploading(false);

      }, "image/jpeg", 0.75);

    };

  };

}
  
  async function publishPost() {

    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  alert("Please login first.");
  router.push("/login");
  return;
}

    // Get username from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    const { error } = await supabase
      .from("community")
      .insert({
  title,
  category,
  content,
  image,
  username: profile?.username,
  user_id: user.id,
});

    if (error) {
      alert(error.message);
      return;
    }

    alert("Post published!");
    router.push("/community");
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-4xl mx-auto pt-24 md:pt-32 px-4 md:px-6">

        <h1 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-8 md:mb-10">
          Create Community Post
        </h1>

        <div className="space-y-5 md:space-y-6">

          <select
           value={category}
           onChange={(e) => setCategory(e.target.value)}
           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 md:p-4 text-sm md:text-base"
           >
           <option value="Artwork">🎨 Artwork</option>
           <option value="Discussion">💬 Discussion</option>
           <option value="Question">❓ Question</option>
           </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
          />

        <div className="space-y-4">

      

  <label
  htmlFor="image-upload"
  className="inline-flex w-full md:w-auto justify-center items-center gap-2 cursor-pointer
bg-yellow-500 hover:bg-yellow-400
text-black font-bold
px-6 py-3 rounded-xl transition"
>
  📷 Upload Artwork
</label>
<p className="text-gray-500 text-sm">
  JPG, PNG or WEBP • Maximum 10 MB
</p>

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
      🖼 uploading artwork...
    </p>
  )}

  {image && (

    <img
      src={image}
      className="w-full rounded-2xl border border-yellow-500 max-h-[450px] object-contain"
      alt="Preview"
    />

  )}

</div>
          
          <button
  onClick={publishPost}
  disabled={uploading}
            className={`w-full md-auto px-8 py-4 rounded-xl font-bold transition ${
  uploading
    ? "bg-zinc-700 text-gray-400 cursor-not-allowed"
    : "bg-yellow-500 hover:bg-yellow-400 text-black"
}`}
          >
            🚀 Publish Post
          </button>

        </div>

      </section>

    </main>
  );
}