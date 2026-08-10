"use client";

import { supabase } from "../lib/supabaseClient";
import { useState, useEffect, useRef } from "react";

type CreatorMessage = {
  id: number;
  conversation_id: number;
  subject: string | null;
  message: string;
  sender: string;
  admin_reply: string | null;
  status: string;
  created_at: string;
  replied_at: string | null;
};

type Props = {
  open?: boolean;
  onClose?: () => void;
  hideButton?: boolean;
};

export default function ChatPopup({
  open: externalOpen,
  onClose,
  hideButton = false,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

const open =
  externalOpen ?? internalOpen;
  const [messages, setMessages] = useState<CreatorMessage[]>([]);
  const [message, setMessage] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  function handleClick(event: MouseEvent) {
    if (
      popupRef.current &&
      !popupRef.current.contains(event.target as Node)
    ) {
      if (onClose) {
  onClose();
} else {
  setInternalOpen(false);
}
    }
  }

  if (open) {
    document.addEventListener("mousedown", handleClick);
  }

  return () => {
    document.removeEventListener("mousedown", handleClick);
  };
}, [open]);

useEffect(() => {
  bottomRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);

async function loadMessages() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("creator_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  setMessages(data ?? []);
}

async function openChat() {
  setInternalOpen(true);
}
useEffect(() => {
  if (!open) return;

  const init = async () => {
    await loadMessages();
  };

  init();

  const channel = supabase
    .channel("creator-chat")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "creator_messages",
      },
      () => {
        loadMessages();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [open]);


async function sendMessage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !message.trim()) return;

  // Find open conversation
  const { data: existingConversation } = await supabase
    .from("creator_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "open")
    .maybeSingle();

  let conversationId = existingConversation?.id;

  // Create one if needed
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

  // Insert new message
  const { error } = await supabase
  .from("creator_messages")
  .insert({
    conversation_id: conversationId,
    user_id: user.id,
    sender: "reader",
    subject: "Conversation",
    message,
    status: "pending",
  });

  if (error) {
    alert(error.message);
    return;
  }

  setMessage("");

  await loadMessages();
}

  return (
    <>
      {/* Floating Button */}

      {!hideButton && (
  <button
    onClick={openChat}
    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-yellow-500 text-black text-2xl shadow-xl hover:scale-105 transition z-50"
  >
    💬
  </button>
)}

      {/* Popup */}

      {open && (
       
       <div 
       ref={popupRef}
        className="fixed bottom-24 right-6 w-[340px] h-[430px] bg-zinc-900 rounded-2xl border border-yellow-500 shadow-2xl flex flex-col z-50">

          {/* Header */}

          <div className="flex justify-between items-center p-4 border-b border-zinc-700">

            <h2 className="font-bold text-yellow-400">
              💬 Creator
            </h2>

            <button
              onClick={() => {
  if (onClose) onClose();
  else setInternalOpen(false);
}}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>

          </div>

          {/* Messages */}

          <div className="flex-1 overflow-y-auto space-y-2">

   {messages.map((item) => (

  <div
    key={item.id}
    className={`flex ${
      item.sender === "reader"
        ? "justify-end"
        : "justify-start"
    } mb-4`}
  >

    <div
      className={`max-w-[75%] px-4 py-3 shadow rounded-2xl ${
        item.sender === "reader"
          ? "bg-yellow-500 text-black rounded-br-md"
          : "bg-zinc-700 text-white rounded-bl-md"
      }`}
    >
       {item.sender === "creator" && (
  <p className="text-yellow-400 text-xs font-bold mb-1">
    📖 Creator
  </p>
)}

      {item.message}

    </div>

  </div>

))}

<div ref={bottomRef} />

          </div>

          {/* Input */}

          <div className="border-t border-zinc-700 p-4">

            <div className="flex gap-3">

  <input
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type message..."
    className="flex-1 rounded-xl bg-black border border-zinc-700 px-4 py-3"
  />

  <button
    onClick={sendMessage}
    className="px-5 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400"
  >
    📩
  </button>

</div>

          </div>

        </div>
      )}
    </>
  );
}