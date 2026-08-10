"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { supabase } from "../../lib/supabaseClient";

type CreatorMessage = {
  id: number;
  subject: string;
  message: string;
  admin_reply: string | null;
  status: string;
  created_at: string;
};

export default function MessagesPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<CreatorMessage[]>([]);

  async function loadMessages() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return

    const { data } = await supabase
  .from("creator_messages")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

    setMessages(data ?? []);
  }

  useEffect(() => {
  const fetchData = async () => {
    await loadMessages();
  };

  fetchData();
}, []);

  async function sendMessage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }


  // Find existing open conversation
  const { data: existingConversation } = await supabase
    .from("creator_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "open")
    .maybeSingle();

  let conversationId = existingConversation?.id;

  // Create one if none exists
  if (!conversationId) {
    const { data: newConversation, error } = await supabase
      .from("creator_conversations")
      .insert({
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    conversationId = newConversation.id;
  }

  // Send the message
  const { error } = await supabase
    .from("creator_messages")
    .insert({
      conversation_id: conversationId,
      sender: "reader",
      message,
      user_id: user.id,
      subject,
    });

  if (error) {
    alert(error.message);
    return;
  }

  setSubject("");
  setMessage("");

  await loadMessages();

  alert("Message sent!");
}

  return (
    <main className="min-h-screen bg-black text-white">

      <Navbar />

      <section className="max-w-4xl mx-auto pt-32 px-6">

        <h1 className="text-5xl font-bold text-yellow-400 mb-4">
          💬 Message Creator
        </h1>

        <p className="text-gray-400 mb-10">
          This is the official way to contact the creator.
        </p>

        <div className="bg-zinc-900 rounded-2xl p-8 space-y-5">

          

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Write your message..."
            className="w-full rounded-xl bg-black border border-zinc-700 p-5"
          />

          <button
            onClick={sendMessage}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl"
          >
            📨 Send Message
          </button>

        </div>

        <div className="mt-14">

          <h2 className="text-3xl font-bold text-yellow-400 mb-6">
            Previous Messages
          </h2>

          <div className="space-y-6">

            {messages.map((item) => (

              <div
                key={item.id}
                className="bg-zinc-900 rounded-2xl p-6"
              >

                <h3 className="text-xl font-bold">
                  {item.subject}
                </h3>

                <p className="text-gray-300 mt-3 whitespace-pre-wrap">
                  {item.message}
                </p>

                <div className="mt-5 border-t border-zinc-700 pt-5">

                  <h4 className="text-yellow-400 font-bold">
                    Creator Reply
                  </h4>

                  {item.admin_reply ? (
                    <p className="mt-2 whitespace-pre-wrap">
                      {item.admin_reply}
                    </p>
                  ) : (
                    <p className="text-gray-500 mt-2">
                      Waiting for reply...
                    </p>
                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

    </main>
  );
}