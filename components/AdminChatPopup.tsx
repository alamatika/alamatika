"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

type Conversation = {
  id: number;
  user_id: string;
  status: string;
  created_at: string;

  profiles: {
    id: string;
    username: string | null;
    avatar: string | null;
  } | null;
};

type ChatMessage = {
  id: number;
  conversation_id: number;
  sender: string;
  message: string;
  created_at: string;
};



export default function AdminChatPopup() {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
const [conversations, setConversations] = useState<Conversation[]>([]);
const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

const [chatMessages, setChatMessages] =
  useState<ChatMessage[]>([]);

const [reply, setReply] = useState("");

async function loadChat(conversationId: number) {

  const { data, error } = await supabase
    .from("creator_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

    console.log("ERROR:", error);
console.log("ROWS:", conversations);

  if (error) {
    console.log(error);
    return;
  }

  setChatMessages(data ?? []);
}

useEffect(() => {
  bottomRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [chatMessages]);

async function sendReply() {
  if (!selectedConversation) return;

  if (!reply.trim()) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("creator_messages")
    .insert({
      conversation_id: selectedConversation,
      user_id: user.id,
      sender: "creator",
      subject: "Conversation",
      message: reply,
      status: "answered",
    });

  if (error) {
    alert(error.message);
    return;
  }

  await supabase
  .from("creator_conversations")
  .update({
    status: "answered",
  })
  .eq("id", selectedConversation);

setReply("");

await loadChat(selectedConversation);

await loadConversations();
}

async function loadConversations() {

  const { data: conversations, error } = await supabase
    .from("creator_conversations")
    .select("*")
    .order("created_at", {
      ascending: false,
    });
    console.log("Conversation count:", conversations?.length);
console.log(conversations);

  if (error) {
    console.log(error);
    return;
  }

  const userIds = conversations.map(
    (c) => c.user_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar")
    .in("id", userIds);

  const merged = conversations.map((conversation) => ({

    ...conversation,

    profiles:
      profiles?.find(
        (p) => p.id === conversation.user_id
      ) ?? null,

  }));
  console.log("RAW:", conversations);
console.log("MERGED:", merged);

  setConversations(merged);
}

useEffect(() => {
  function handleClick(event: MouseEvent) {
    if (
      popupRef.current &&
      !popupRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  }

  if (open) {
    document.addEventListener("mousedown", handleClick);
  }

  return () => {
    document.removeEventListener("mousedown", handleClick);
  };
}, [open]);

  return (
    <>

    
      {/* Floating Button */}

      <button
        onClick={async () => {
  await loadConversations();
  setOpen(true);
}}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white text-2xl shadow-xl hover:scale-105 transition z-50"
      >
        📩
      </button>

      {/* Popup */}

      {open && (
        <div
        ref={popupRef}
        className="fixed bottom-24 right-6 w-[700px] max-h-[70vh] rounded-2xl bg-zinc-900 border border-blue-500 shadow-2xl flex overflow-hidden z-50">
         

          {/* LEFT */}

          <div className="w-64 border-r border-zinc-700">

            <div className="flex justify-between items-center p-4 border-b border-zinc-700">

  <h2 className="font-bold text-blue-400">
    Creator Inbox
  </h2>

  <button
    onClick={() => setOpen(false)}
    className="text-gray-400 hover:text-white transition"
  >
    ✕
  </button>

</div>

            <div className="overflow-y-auto">

              <div className="divide-y divide-zinc-800">

  {conversations.map((conversation) => (

    <button
      key={conversation.id}
      onClick={async () => {

  setSelectedConversation(conversation.id);

  await loadChat(conversation.id);

}}
      className={`w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition ${
        selectedConversation === conversation.id
          ? "bg-zinc-800"
          : ""
      }`}
    >

      {conversation.profiles?.avatar ? (

        <img
          src={conversation.profiles.avatar}
          className="w-10 h-10 rounded-full object-cover"
        />

      ) : (

        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
          👤
        </div>

      )}

      <div className="text-left">

        <p className="font-bold">
          {conversation.profiles?.username ??
            "Unknown"}
        </p>

        <p className="text-xs text-gray-400">
          {conversation.status}
        </p>

      </div>

    </button>

  ))}

</div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex-1 flex flex-col">

            <div className="p-4 border-b border-zinc-700">
              {
  selectedConversation
    ? conversations.find(
        c => c.id === selectedConversation
      )?.profiles?.username ?? "Conversation"
    : "Select a conversation"
}
            </div>

            <div className="flex-1 overflow-y-auto p-4">

              <div className="space-y-4">

  {chatMessages.map((msg) => (

    <div
      key={msg.id}
      className={`max-w-[75%] rounded-xl px-4 py-3 ${
        msg.sender === "reader"
          ? "bg-zinc-800"
          : "bg-blue-600 ml-auto"
      }`}
    >

      {msg.message}

    </div>

  ))}

  <div ref={bottomRef} />

</div>

            </div>

            <div className="border-t border-zinc-700 p-4">

              <div className="flex gap-3">

  <input
    value={reply}
    onChange={(e) => setReply(e.target.value)}
    placeholder="Reply..."
    className="flex-1 rounded-xl bg-black border border-zinc-700 px-4 py-3"
  />

  <button
    onClick={sendReply}
    className="px-5 rounded-xl bg-blue-600 hover:bg-blue-500"
  >
    Send
  </button>

</div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}