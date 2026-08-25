"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

type Conversation = {
  id: number;
  user_id: string;
  status: string;
  created_at: string;

  latest_message?: {
    id: number;
    conversation_id: number;
    message: string;
    sender: string;
    created_at: string;
  } | null;

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
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_url?: string | null;
};


export default function CreatorChatPopup() {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
const [conversations, setConversations] = useState<Conversation[]>([]);
const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

const [chatMessages, setChatMessages] =
  useState<ChatMessage[]>([]);
  const [sendingReply, setSendingReply] =
  useState(false);

const [reply, setReply] = useState("");
const [unreadCount, setUnreadCount] = useState(0);

async function loadUnreadCount() {
  const { count } = await supabase
    .from("creator_messages")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("sender", "reader")
    .eq("is_read", false);

  setUnreadCount(count ?? 0);
}

async function markConversationRead(
  conversationId: number
) {
  // Clear the visible badge immediately.
  const { count } = await supabase
    .from("creator_messages")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "conversation_id",
      conversationId
    )
    .eq("sender", "reader")
    .eq("is_read", false);

  setUnreadCount((current) =>
    Math.max(
      current - (count ?? 0),
      0
    )
  );

  try {
    const response = await fetch(
      "/api/creator/chat-read",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId,
        }),
      }
    );

    if (!response.ok) {
      const data =
        await response.json().catch(
          () => ({})
        );

      console.error(
        "Mark conversation read failed:",
        data
      );

      await loadUnreadCount();
      return;
    }

    // Confirm final count from the database.
    await loadUnreadCount();
  } catch (error) {
    console.error(
      "Mark conversation read error:",
      error
    );

    await loadUnreadCount();
  }
}

async function loadChat(
  conversationId: number
) {
  const response = await fetch(
  `/api/creator/chat-messages?conversationId=${conversationId}`,
  {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  }
);

const result = await response.json();

if (!response.ok) {
  console.error(
    "Load creator conversation failed:",
    result?.error
  );
  return;
}

const data: ChatMessage[] =
  result.messages ?? [];

  const messagesWithAttachments =
    await Promise.all(
      (data ?? []).map(
        async (message) => {
          if (
            !message.attachment_path
          ) {
            return {
              ...message,
              attachment_url: null,
            };
          }

          try {
            const response =
              await fetch(
                `/api/creator/chat-attachment?path=${encodeURIComponent(
                  message.attachment_path
                )}`,
                {
                  credentials:
                    "include",
                }
              );

            if (!response.ok) {
              return {
                ...message,
                attachment_url: null,
              };
            }

            const result =
              await response.json();

            return {
              ...message,
              attachment_url:
                result.url ?? null,
            };
          } catch {
            return {
              ...message,
              attachment_url: null,
            };
          }
        }
      )
    );

  setChatMessages(
    messagesWithAttachments
  );
}

useEffect(() => {
  bottomRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [chatMessages]);

async function sendReply() {
  if (sendingReply) return;

  if (!selectedConversation) return;

  if (!reply.trim()) return;

  setSendingReply(true);

  try {
    const response = await fetch(
  "/api/creator/chat-messages",
  {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify({
      conversationId:
        selectedConversation,
      message: reply.trim(),
    }),
  }
);

const result = await response.json();

if (!response.ok) {
  alert(
    result?.error ??
      "Could not send reply."
  );
  return;
}


    setReply("");

    await loadChat(
      selectedConversation
    );

    await loadConversations();
  } finally {
    setSendingReply(false);
  }
}

async function loadConversations() {
  try {
    const response = await fetch(
      "/api/creator/chat-conversations",
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Conversation loading failed:",
        result?.error
      );
      return;
    }

    setConversations(
      result.conversations ?? []
    );
  } catch (error) {
    console.error(
      "Conversation loading error:",
      error
    );
  }
}

useEffect(() => {
  if (!open) return;

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;

    if (
      popupRef.current &&
      !popupRef.current.contains(target)
    ) {
      setOpen(false);
    }
  }

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, [open]);

useEffect(() => {
  const channel = supabase
    .channel("creator-inbox-messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "creator_messages",
      },
      async (payload) => {
        const message = payload.new as {
          sender?: string;
          conversation_id?: number;
        };

        if (message.sender !== "reader") {
  return;
}

setUnreadCount((count) => count + 1);

await loadUnreadCount();
await loadConversations();

if (
  open &&
  selectedConversation &&
  message.conversation_id === selectedConversation
) {
  await loadChat(
    selectedConversation
  );
}

      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [open, selectedConversation]);

return (
  <>
    {/* Floating Button */}

    <div className="fixed bottom-6 right-6 z-50">

      <button
        type="button"
        onClick={async () => {
          await loadConversations();
          await loadUnreadCount();
          setSelectedConversation(null);
          setOpen(true);
        }}
        className="w-14 h-14 rounded-full bg-blue-600 text-white text-2xl shadow-xl hover:scale-105 transition"
      >
        📩
      </button>

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

    </div>

    {/* Popup */}

    {open && (
      <div
        ref={popupRef}
        className="fixed bottom-4 left-2 right-2 sm:left-auto sm:right-6 sm:bottom-24 w-auto sm:w-[420px] h-[80vh] sm:h-[650px] max-h-[80vh] rounded-2xl bg-zinc-900 border border-blue-500 shadow-2xl overflow-hidden z-50 flex flex-col"
      >

        {/* =========================
            CONVERSATION LIST
        ========================== */}

        {selectedConversation === null ? (

          <>

            <div className="flex justify-between items-center p-4 border-b border-zinc-700 shrink-0">

              <h2 className="font-bold text-blue-400 text-lg">
                📩 Creator Inbox
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition text-xl"
              >
                ✕
              </button>

            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3">

              {conversations.length === 0 ? (

                <div className="h-full flex items-center justify-center text-gray-500 text-center px-6">
                  No reader conversations yet.
                </div>

              ) : (

                <div className="space-y-2">

                  {conversations.map((conversation) => (

                    <button
                      key={conversation.id}
                      type="button"
                      onClick={async () => {

                        setSelectedConversation(
                          conversation.id
                        );

                        await markConversationRead(
                          conversation.id
                        );

                        await loadChat(
                          conversation.id
                        );

                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 transition text-left"
                    >

                      {conversation.profiles?.avatar ? (

                        <img
                          src={
                            conversation.profiles.avatar
                          }
                          alt={
                            conversation.profiles.username ??
                            "Reader"
                          }
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />

                      ) : (

                        <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                          👤
                        </div>

                      )}

                      <div className="min-w-0 flex-1">

                        <p className="font-bold truncate">
                          {conversation.profiles?.username ??
                            "Unknown Reader"}
                        </p>

                        <p className="text-xs text-gray-400 mt-1 truncate">
  {conversation.latest_message?.message ||
    "No messages yet."}
</p>

                      </div>

                      <span className="text-blue-400 text-lg">
                        →
                      </span>

                    </button>

                  ))}

                </div>

              )}

            </div>

          </>

        ) : (

          /* =========================
             CHAT VIEW
          ========================== */

          <>

            <div className="flex items-center gap-3 p-4 border-b border-zinc-700 shrink-0">

              <button
                type="button"
                onClick={() => {
                  setSelectedConversation(
                    null
                  );
                  setChatMessages([]);
                }}
                className="text-gray-400 hover:text-white transition text-xl"
              >
                ←
              </button>

              <div className="min-w-0 flex-1">

                <p className="font-bold text-blue-400 truncate">
                  {
                    conversations.find(
                      (c) =>
                        c.id ===
                        selectedConversation
                    )?.profiles
                      ?.username ??
                    "Reader"
                  }
                </p>

                <p className="text-xs text-gray-500">
                  Private conversation
                </p>

              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition text-xl"
              >
                ✕
              </button>

            </div>

            {/* Messages */}

            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">

              <div className="space-y-4">

                {chatMessages.length === 0 ? (

                  <p className="text-center text-gray-500 py-10">
                    No messages yet.
                  </p>

                ) : (

                  chatMessages.map((msg) => (

                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "reader"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.sender === "reader"
                            ? "bg-zinc-800 text-white rounded-bl-md"
                            : "bg-blue-600 text-white rounded-br-md"
                        }`}
                      >

                        {msg.sender === "reader" && (
                          <p className="text-blue-300 text-xs font-bold mb-1">
                            📖 Reader
                          </p>
                        )}

                        <p className="whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>

                        {msg.attachment_url && (
                          <a
                            href={
                              msg.attachment_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-3"
                          >
                            <img
                              src={
                                msg.attachment_url
                              }
                              alt="Payment proof"
                              className="max-w-full max-h-72 rounded-xl border border-zinc-600 object-contain"
                            />
                          </a>
                        )}

                      </div>

                    </div>

                  ))

                )}

                <div ref={bottomRef} />

              </div>

            </div>

            {/* Reply */}

            <div className="border-t border-zinc-700 p-3 sm:p-4 shrink-0">

              <div className="flex gap-2">

                <input
                  value={reply}
                  onChange={(e) =>
                    setReply(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      sendReply();
                    }
                  }}
                  placeholder="Reply to reader..."
                  className="flex-1 min-w-0 rounded-xl bg-black border border-zinc-700 px-3 py-3 outline-none focus:border-blue-500"
                  disabled={sendingReply}
                />

                <button
                  type="button"
                  onClick={sendReply}
                  disabled={
                    sendingReply ||
                    !reply.trim()
                  }
                  className="px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply
                    ? "⏳"
                    : "Send"}
                </button>

              </div>

            </div>

          </>

        )}

      </div>
    )}
  </>
);
}