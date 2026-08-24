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
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_url?: string | null;
  is_read: boolean;
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
  const [attachment, setAttachment] =
  useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [unreadCount, setUnreadCount] = useState(0);


  async function loadUnreadCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setUnreadCount(0);
    return;
  }

  const { count } = await supabase
    .from("creator_messages")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id)
    .eq("sender", "creator")
    .eq("is_read", false);

  setUnreadCount(count ?? 0);
}

async function markCreatorMessagesRead() {
  // Make the notification disappear immediately.
  setUnreadCount(0);

  const { error } = await supabase.rpc(
    "mark_creator_messages_read"
  );

  if (error) {
    console.error(
      "Failed to mark Creator messages as read:",
      error
    );

    // Restore the real count if the RPC failed.
    await loadUnreadCount();
    return;
  }

  // Confirm the database is now clear.
  await loadUnreadCount();
}

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

  const { data, error } = await supabase
    .from("creator_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("Load messages:", error);
    return;
  }

  const messagesWithAttachments =
    await Promise.all(
      (data ?? []).map(async (item) => {
        if (!item.attachment_path) {
          return {
            ...item,
            attachment_url: null,
          };
        }

        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("chat-attachments")
            .createSignedUrl(
              item.attachment_path,
              60 * 10
            );

        if (signedError) {
          console.error(
            "Attachment URL error:",
            signedError
          );

          return {
            ...item,
            attachment_url: null,
          };
        }

        return {
          ...item,
          attachment_url:
            signedData?.signedUrl ?? null,
        };
      })
    );

  setMessages(messagesWithAttachments);
}

async function openChat() {
  setInternalOpen(true);
  await markCreatorMessagesRead();
  await loadMessages();
}

useEffect(() => {
  if (!open) return;

  const init = async () => {
    await loadMessages();
    await markCreatorMessagesRead();
    await loadUnreadCount();
  };

  init();

  const channel = supabase
    .channel("reader-creator-chat")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "creator_messages",
      },
      () => {
        loadMessages();
        loadUnreadCount();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [open]);

async function sendMessage() {
  if (sending) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    return;
  }

  if (!message.trim() && !attachment) {
    return;
  }

  if (attachment) {
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(attachment.type)
    ) {
      alert(
        "Please choose a JPG, PNG, or WEBP image."
      );
      return;
    }

    if (attachment.size > 5 * 1024 * 1024) {
      alert(
        "Image must be 5 MB or smaller."
      );
      return;
    }
  }

  setSending(true);

  let attachmentPath: string | null = null;

  try {
    const {
      data: existingConversation,
      error: conversationError,
    } = await supabase
      .from("creator_conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();

    if (conversationError) {
      throw conversationError;
    }

    let conversationId =
      existingConversation?.id;

    if (!conversationId) {
      const {
        data: newConversation,
        error,
      } = await supabase
        .from("creator_conversations")
        .insert({
          user_id: user.id,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      conversationId =
        newConversation.id;
    }

    if (attachment) {
      const extension =
        attachment.name
          .split(".")
          .pop()
          ?.toLowerCase() || "png";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      attachmentPath =
        `${user.id}/${conversationId}/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("chat-attachments")
        .upload(
          attachmentPath,
          attachment,
          {
            contentType: attachment.type,
            upsert: false,
          }
        );

      if (uploadError) {
        throw uploadError;
      }
    }

    const {
  data: insertedMessage,
  error: messageError,
} = await supabase
  .from("creator_messages")
  .insert({
    conversation_id: conversationId,
    user_id: user.id,
    sender: "reader",
    subject: "Conversation",
    message:
      message.trim() ||
      "Payment proof attached.",
    status: "pending",
    attachment_path: attachmentPath,
    attachment_type:
      attachment?.type ?? null,
    is_read: false,
  })
  .select("*")
  .single();

if (messageError || !insertedMessage) {
  if (attachmentPath) {
    await supabase.storage
      .from("chat-attachments")
      .remove([attachmentPath]);
  }

  throw (
    messageError ??
    new Error("Message was not created.")
  );
}

/*
 * Show the newly sent message immediately.
 * We don't wait for Supabase Realtime.
 */
let attachmentUrl: string | null = null;

if (attachmentPath) {
  const { data: signedData } =
    await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(
        attachmentPath,
        60 * 10
      );

  attachmentUrl =
    signedData?.signedUrl ?? null;
}

setMessages((current) => {
  const alreadyExists = current.some(
    (item) =>
      item.id === insertedMessage.id
  );

  if (alreadyExists) {
    return current;
  }

  return [
    ...current,
    {
      ...insertedMessage,
      attachment_url: attachmentUrl,
    },
  ];
});

setMessage("");
setAttachment(null);

  } catch (error) {
    console.error(
      "SEND MESSAGE ERROR:",
      error
    );

    if (attachmentPath) {
      await supabase.storage
        .from("chat-attachments")
        .remove([attachmentPath]);
    }

    alert(
      error instanceof Error
        ? error.message
        : "Failed to send message."
    );
  } finally {
    setSending(false);
  }
}


  return (
    <>
      {/* Floating Button */}

      {!hideButton && (
  <div className="fixed bottom-6 right-6 z-50">

    <button
      onClick={openChat}
      className="w-14 h-14 rounded-full bg-yellow-500 text-black text-2xl shadow-xl hover:scale-105 transition"
    >
      💬
    </button>

    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}

  </div>
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

{item.attachment_url && (
  <a
    href={item.attachment_url}
    target="_blank"
    rel="noopener noreferrer"
    className="block mt-3"
  >
    <img
      src={item.attachment_url}
      alt="Payment proof"
      className="max-w-full max-h-64 rounded-xl border border-zinc-600 object-contain"
    />
  </a>
)}

    </div>

  </div>

))}

<div ref={bottomRef} />

          </div>

          {/* Input */}

          <div className="border-t border-zinc-700 p-4">

  {attachment && (
    <div className="mb-3 flex items-center justify-between bg-zinc-800 rounded-xl p-3">

      <div className="flex items-center gap-3 min-w-0">

        <span className="text-xl">
          🖼️
        </span>

        <p className="text-sm text-gray-300 truncate">
          {attachment.name}
        </p>

      </div>

      <button
        type="button"
        onClick={() =>
          setAttachment(null)
        }
        className="text-red-400 hover:text-red-300"
      >
        ✕
      </button>

    </div>
  )}

  <div className="flex gap-2">

    <label className="shrink-0 cursor-pointer px-4 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700">

      📎

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={sending}
        onChange={(e) => {
          const file =
            e.target.files?.[0];

          if (file) {
            setAttachment(file);
          }

          e.target.value = "";
        }}
      />

    </label>

    <input
      value={message}
      onChange={(e) =>
        setMessage(e.target.value)
      }
      placeholder="Type message..."
      className="flex-1 min-w-0 rounded-xl bg-black border border-zinc-700 px-4 py-3"
      disabled={sending}
    />

    <button
  type="button"
  onClick={sendMessage}
  disabled={
    sending ||
    (!message.trim() && !attachment)
  }
  className="px-4 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {sending ? "⏳" : "📩"}
</button>

  </div>

</div>

        </div>
      )}
    </>
  );
}