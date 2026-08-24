"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import Navbar from "../../../components/navbar";
import CreatorGuard from "../../../components/CreatorGuard";

type Reader = {
  id: string;
  username: string | null;
  email: string | null;
  display_name: string | null;
  credits: number | null;
};

type GrantHistory = {
  id: number;
  credits: number;
  reason: string;
  note: string | null;
  created_at: string;
};

export default function ReaderAccountsPage() {
  const [query, setQuery] = useState("");
  const [readers, setReaders] = useState<Reader[]>(
    []
  );
  const [allReaders, setAllReaders] = useState<Reader[]>([]);
const [readerPage, setReaderPage] = useState(1);
const [readerTotal, setReaderTotal] = useState(0);
const [loadingAllReaders, setLoadingAllReaders] = useState(false);

const readersPerPage = 10;

  const [selectedReader, setSelectedReader] =
    useState<Reader | null>(null);

  const [credits, setCredits] = useState("");
  const [reason, setReason] =
    useState("Payment");
  const [note, setNote] = useState("");

  const [history, setHistory] =
    useState<GrantHistory[]>([]);

  const [searching, setSearching] =
    useState(false);

  const [granting, setGranting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function searchReaders() {
    setMessage("");
    setSelectedReader(null);
    setHistory([]);

    if (query.trim().length < 2) {
      setMessage(
        "Enter at least 2 characters."
      );
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(
        `/api/creator/reader-credits?q=${encodeURIComponent(
          query.trim()
        )}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Failed to search readers."
        );
        return;
      }

      setReaders(data.readers ?? []);

      if (
        !data.readers ||
        data.readers.length === 0
      ) {
        setMessage(
          "No reader accounts found."
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(
        "Failed to search readers."
      );
    } finally {
      setSearching(false);
    }
  }

  const loadAllReaders = useCallback(
  async (page = 1) => {
    setLoadingAllReaders(true);

    try {
      const response = await fetch(
        `/api/creator/reader-credits?all=true&page=${page}&limit=${readersPerPage}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Failed to load readers."
        );
        return;
      }

      setAllReaders(data.readers ?? []);
      setReaderTotal(data.total ?? 0);
      setReaderPage(page);
    } catch (error) {
      console.error(error);

      setMessage(
        "Failed to load readers."
      );
    } finally {
      setLoadingAllReaders(false);
    }
  },
  []
);

useEffect(() => {
  let cancelled = false;

  async function initialLoad() {
    setLoadingAllReaders(true);

    try {
      const response = await fetch(
        `/api/creator/reader-credits?all=true&page=1&limit=${readersPerPage}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (cancelled) return;

      if (!response.ok) {
        setMessage(
          data.error ||
            "Failed to load readers."
        );
        return;
      }

      setAllReaders(data.readers ?? []);
      setReaderTotal(data.total ?? 0);
      setReaderPage(1);
    } catch (error) {
      if (cancelled) return;

      console.error(error);

      setMessage(
        "Failed to load readers."
      );
    } finally {
      if (!cancelled) {
        setLoadingAllReaders(false);
      }
    }
  }

  initialLoad();

  return () => {
    cancelled = true;
  };
}, []);

  async function selectReader(reader: Reader) {
    setSelectedReader(reader);
    setMessage("");

    const response = await fetch(
      `/api/creator/reader-credits?userId=${encodeURIComponent(
        reader.id
      )}`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.ok) {
      setHistory(data.history ?? []);
    }
  }

  async function giveCredits() {
    if (!selectedReader) {
      setMessage(
        "Select a reader first."
      );
      return;
    }

    const amount = Number(credits);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setMessage(
        "Enter a positive whole number of credits."
      );
      return;
    }

    if (!reason.trim()) {
      setMessage(
        "Please choose a reason."
      );
      return;
    }

    setGranting(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/creator/reader-credits",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId: selectedReader.id,
            credits: amount,
            reason,
            note,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Failed to give credits."
        );
        return;
      }

      setSelectedReader((current) =>
        current
          ? {
              ...current,
              credits:
                data.newBalance,
            }
          : current
      );

      setCredits("");
      setNote("");

      await selectReader({
        ...selectedReader,
        credits: data.newBalance,
      });

      setMessage(
        `Successfully gave ${amount} credits.`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "Failed to give credits."
      );
    } finally {
      setGranting(false);
    }
  }

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white">

        <Navbar />

        <section className="max-w-5xl mx-auto pt-28 md:pt-32 px-5 sm:px-6">

          <Link
            href="/creator"
            className="text-yellow-400 hover:text-yellow-300 transition"
          >
            ← Creator Studio
          </Link>

          <div className="mt-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">
              👥 Reader Accounts
            </h1>

            <p className="text-gray-400 mt-3">
              Search readers and manually grant
              credits for payments, rewards,
              or other approved reasons.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 mt-8 border border-yellow-500/30">

  <h2 className="text-2xl font-bold text-yellow-400">
    🎁 Reader Compensation
  </h2>

  <p className="text-gray-400 mt-2">
    Give the same number of credits to all eligible reader accounts.
  </p>

  <div className="grid md:grid-cols-2 gap-4 mt-6">

    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Credits for each reader
      </label>

      <input
        type="number"
        min="1"
        step="1"
        value={credits}
        onChange={(e) =>
          setCredits(e.target.value)
        }
        placeholder="100"
        className="w-full bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
      />
    </div>

    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Reason
      </label>

      <select
        value={reason}
        onChange={(e) =>
          setReason(e.target.value)
        }
        className="w-full bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
      >
        <option value="Compensation">
          Compensation
        </option>
        <option value="Reward">
          Reward
        </option>
        <option value="Payment">
          Payment
        </option>
        <option value="Manual Adjustment">
          Manual Adjustment
        </option>
        <option value="Other">
          Other
        </option>
      </select>
    </div>

  </div>

  <div className="mt-4">

    <label className="block text-sm text-gray-400 mb-2">
      Note
    </label>

    <textarea
      rows={3}
      value={note}
      onChange={(e) =>
        setNote(e.target.value)
      }
      placeholder="Example: Compensation for Alamatika hiatus"
      className="w-full bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
    />

  </div>

  <button
    type="button"
    onClick={async () => {
      const amount = Number(credits);

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        setMessage(
          "Enter a positive whole number of credits."
        );
        return;
      }

      const confirmed = window.confirm(
        `Give ${amount} credits to ALL eligible readers?\n\n` +
        `Reason: ${reason}\n\n` +
        `This action cannot be automatically undone.`
      );

      if (!confirmed) return;

      setMessage("");

      try {
        const response =
          await fetch(
            "/api/creator/reader-credits",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                grantToAll: true,
                credits: amount,
                reason,
                note,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setMessage(
            data.error ||
              "Failed to grant credits."
          );
          return;
        }

        setMessage(
          `✅ ${amount} credits were granted to ${data.affectedReaders} readers.`
        );

        setCredits("");
        setNote("");
      } catch (error) {
        console.error(error);

        setMessage(
          "Failed to grant credits."
        );
      }
    }}
    className="w-full mt-5 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition"
  >
    🎁 Give Credits to All Readers
  </button>

</div>

          {/* SEARCH */}

          <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 mt-10">

            <h2 className="text-2xl font-bold text-yellow-400 mb-5">
              🔎 Find Reader
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">

              <input
                type="text"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchReaders();
                  }
                }}
                placeholder="Username or email"
                className="flex-1 bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
              />

              <button
                type="button"
                onClick={searchReaders}
                disabled={searching}
                className="px-6 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50"
              >
                {searching
                  ? "Searching..."
                  : "Search"}
              </button>

            </div>

            {message && (
              <p className="mt-4 text-yellow-400">
                {message}
              </p>
            )}

          </div>

          {/* ALL READERS */}

<div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 mt-6">

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

    <div>
      <h2 className="text-2xl font-bold text-yellow-400">
        👥 All Readers
      </h2>

      <p className="text-gray-500 text-sm mt-1">
        {readerTotal === 0
          ? "No reader accounts yet."
          : `Showing ${
              (readerPage - 1) *
                readersPerPage +
              1
            }–${Math.min(
              readerPage *
                readersPerPage,
              readerTotal
            )} of ${readerTotal}`}
      </p>
    </div>

  </div>

  {loadingAllReaders ? (

    <p className="text-gray-500 py-6 text-center">
      Loading readers...
    </p>

  ) : allReaders.length === 0 ? (

    <p className="text-gray-500 py-6 text-center">
      No reader accounts found.
    </p>

  ) : (

    <div className="space-y-3">

      {allReaders.map((reader) => (

        <button
          key={reader.id}
          type="button"
          onClick={() =>
            selectReader(reader)
          }
          className={`w-full text-left rounded-xl p-4 border transition ${
            selectedReader?.id ===
            reader.id
              ? "border-yellow-500 bg-zinc-800"
              : "border-zinc-800 bg-zinc-950 hover:border-yellow-500/50"
          }`}
        >

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

            <div>

              <p className="font-bold">
                {reader.display_name ||
                  reader.username ||
                  "Unnamed Reader"}
              </p>

              <p className="text-gray-400 text-sm">
                @{reader.username ||
                  "no username"}
              </p>

              <p className="text-gray-500 text-sm">
                {reader.email ||
                  "No email"}
              </p>

            </div>

            <p className="text-yellow-400 font-bold">
              💎{" "}
              {reader.credits ?? 0}
            </p>

          </div>

        </button>

      ))}

    </div>

  )}

  {readerTotal > readersPerPage && (

    <div className="flex flex-wrap justify-center items-center gap-2 mt-6">

      <button
        type="button"
        disabled={readerPage === 1}
        onClick={() =>
          loadAllReaders(
            readerPage - 1
          )
        }
        className="px-3 py-2 rounded-lg border border-zinc-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ←
      </button>

      {Array.from(
        {
          length: Math.ceil(
            readerTotal /
              readersPerPage
          ),
        },
        (_, index) => {
          const page =
            index + 1;

          return (
            <button
              key={page}
              type="button"
              onClick={() =>
                loadAllReaders(page)
              }
              className={`min-w-9 px-3 py-2 rounded-lg font-bold transition ${
                readerPage === page
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
              }`}
            >
              {page}
            </button>
          );
        }
      )}

      <button
        type="button"
        disabled={
          readerPage >=
          Math.ceil(
            readerTotal /
              readersPerPage
          )
        }
        onClick={() =>
          loadAllReaders(
            readerPage + 1
          )
        }
        className="px-3 py-2 rounded-lg border border-zinc-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        →
      </button>

    </div>

  )}

</div>

          {/* SEARCH RESULTS */}

          {readers.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 mt-6">

              <h2 className="text-2xl font-bold text-yellow-400 mb-5">
                Readers
              </h2>

              <div className="space-y-3">

                {readers.map((reader) => (

                  <button
                    key={reader.id}
                    type="button"
                    onClick={() =>
                      selectReader(reader)
                    }
                    className={`w-full text-left rounded-xl p-4 border transition ${
                      selectedReader?.id ===
                      reader.id
                        ? "border-yellow-500 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950 hover:border-yellow-500/50"
                    }`}
                  >

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                      <div>

                        <p className="font-bold">
                          {reader.display_name ||
                            reader.username ||
                            "Unnamed Reader"}
                        </p>

                        <p className="text-gray-400 text-sm">
                          @{reader.username ||
                            "no username"}
                        </p>

                        <p className="text-gray-500 text-sm">
                          {reader.email ||
                            "No email"}
                        </p>

                      </div>

                      <p className="text-yellow-400 font-bold">
                        💎{" "}
                        {reader.credits ?? 0}
                      </p>

                    </div>

                  </button>

                ))}

              </div>

            </div>
          )}

          {/* SELECTED READER */}

          {selectedReader && (
            <>
              <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 mt-6">

                <h2 className="text-2xl font-bold text-yellow-400">
                  💎 Give Credits
                </h2>

                <div className="mt-5">

                  <p className="text-gray-400">
                    Reader
                  </p>

                  <p className="text-xl font-bold">
                    {selectedReader.display_name ||
                      selectedReader.username ||
                      "Reader"}
                  </p>

                  <p className="text-gray-500">
                    {selectedReader.email ||
                      "No email"}
                  </p>

                </div>

                <div className="mt-6 bg-zinc-800 rounded-xl p-5">
                  <p className="text-gray-400">
                    Current Balance
                  </p>

                  <p className="text-4xl font-bold text-yellow-400 mt-2">
                    💎{" "}
                    {selectedReader.credits ??
                      0}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Credits to give
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={credits}
                      onChange={(e) =>
                        setCredits(
                          e.target.value
                        )
                      }
                      placeholder="100"
                      className="w-full bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Reason
                    </label>

                    <select
                      value={reason}
                      onChange={(e) =>
                        setReason(
                          e.target.value
                        )
                      }
                      className="w-full bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
                    >
                      <option value="Payment">
                        Payment
                      </option>

                      <option value="Reward">
                        Reward
                      </option>

                      <option value="Compensation">
                        Compensation
                      </option>

                      <option value="Manual Adjustment">
                        Manual Adjustment
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                </div>

                <div className="mt-4">

                  <label className="block text-sm text-gray-400 mb-2">
                    Note (optional)
                  </label>

                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) =>
                      setNote(
                        e.target.value
                      )
                    }
                    placeholder="Optional payment/reference/reward note"
                    className="w-full bg-zinc-800 rounded-xl p-4 border border-yellow-500/30"
                  />

                </div>

                <button
                  type="button"
                  onClick={giveCredits}
                  disabled={granting}
                  className="w-full mt-5 py-4 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
                >
                  {granting
                    ? "⏳ Giving Credits..."
                    : "💎 Give Credits"}
                </button>

              </div>

              {/* HISTORY */}

              <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 mt-6">

                <h2 className="text-2xl font-bold text-yellow-400 mb-5">
                  📜 Credit Grant History
                </h2>

                {history.length === 0 ? (

                  <p className="text-gray-500">
                    No manual credit grants yet.
                  </p>

                ) : (

                  <div className="space-y-3">

                    {history.map((item) => (

                      <div
                        key={item.id}
                        className="bg-zinc-800 rounded-xl p-4"
                      >

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                          <p className="text-green-400 font-bold">
                            +{item.credits} credits
                          </p>

                          <p className="text-gray-500 text-sm">
                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </p>

                        </div>

                        <p className="mt-2">
                          {item.reason}
                        </p>

                        {item.note && (
                          <p className="text-gray-400 text-sm mt-1">
                            {item.note}
                          </p>
                        )}

                      </div>

                    ))}

                  </div>

                )}

              </div>
            </>
          )}

        </section>

        <footer className="mt-24 mb-10 text-gray-600 text-sm text-center">
          © Alamatika. All Rights Reserved.
          <br />
          Version 1.0.0
        </footer>

      </main>
    </CreatorGuard>
  );
}