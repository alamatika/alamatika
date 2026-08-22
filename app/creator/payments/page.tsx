"use client";

import { useEffect, useState } from "react";
import CreatorGuard from "../../../components/CreatorGuard";

type Profile = {
  username: string | null;
  display_name: string | null;
  email: string | null;
};

type Payment = {
  id: number;
  created_at: string;
  user_id: string;
  payment_code: string | null;
  credits: number;
  peso_amount: number;
  payment_provider: string | null;
  payment_reference: string | null;
  status: string;
  expires_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  profiles: Profile | Profile[] | null;
};

export default function CreatorPaymentsPage() {
  const [pendingPayments, setPendingPayments] =
    useState<Payment[]>([]);

  const [approvedPayments, setApprovedPayments] =
    useState<Payment[]>([]);
    const [rejectedPayments, setRejectedPayments] =
  useState<Payment[]>([]);

  const [showRejected, setShowRejected] =
  useState(false);

  const [showApproved, setShowApproved] =
  useState(false);

  const [loading, setLoading] = useState(true);

  const [approvingId, setApprovingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/creator/payments",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not load payments."
        );
      }

      setPendingPayments(
        result.pendingPayments ?? []
      );

      setApprovedPayments(
        result.approvedPayments ?? []
      );
      setRejectedPayments(
  result.rejectedPayments ?? []
);

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not load payments."
      );
    } finally {
      setLoading(false);
    }
  }

  async function approvePayment(paymentId: number) {
    const confirmed = window.confirm(
      "Approve this payment and release the credits?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setApprovingId(paymentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/creator/payments/approve",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not approve payment."
        );
      }

      setSuccess(
        `Payment approved. ${
          result.creditsAdded ?? 0
        } credits released.`
      );

      await loadPayments();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not approve payment."
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function rejectPayment(paymentId: number) {
  const confirmed = window.confirm(
    "Reject this payment request? No credits will be added."
  );

  if (!confirmed) {
    return;
  }

  try {
    setApprovingId(paymentId);
    setError("");
    setSuccess("");

    const response = await fetch(
      "/api/creator/payments/reject",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Could not reject payment."
      );
    }

    setSuccess(
      result.alreadyProcessed
        ? "Payment was already rejected."
        : "Payment rejected successfully."
    );

    await loadPayments();
  } catch (error) {
    console.error(error);

    setError(
      error instanceof Error
        ? error.message
        : "Could not reject payment."
    );
  } finally {
    setApprovingId(null);
  }
}

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/creator/payments",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Could not load payments."
          );
        }

        if (!cancelled) {
          setPendingPayments(
            result.pendingPayments ?? []
          );

          setApprovedPayments(
            result.approvedPayments ?? []
          );
          setRejectedPayments(
  result.rejectedPayments ?? []
);

        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load payments."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  function getProfile(payment: Payment) {
    if (!payment.profiles) {
      return null;
    }

    if (Array.isArray(payment.profiles)) {
      return payment.profiles[0] ?? null;
    }

    return payment.profiles;
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString();
  }

  function PaymentCard({
  payment,
  status,
}: {
  payment: Payment;
  status: "pending" | "approved" | "rejected";
}) {

    const profile = getProfile(payment);

    const displayName =
      profile?.display_name ||
      profile?.username ||
      "Unknown user";

    return (
      <div
        style={{
          border:
  status === "pending"
    ? "1px solid #684242"
    : status === "approved"
    ? "1px solid #315a3b"
    : "1px solid #7f1d1d",
          borderRadius: "12px",
          padding: "20px",
          background: "black",
        }}
      >
        {/* USER HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
              }}
            >
              {displayName}
            </h2>

            {profile?.username && (
              <p
                style={{
                  margin: "4px 0 0",
                  opacity: 0.65,
                }}
              >
                @{profile.username}
              </p>
            )}

            {/* USER ID */}

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "12px",
                opacity: 0.5,
                wordBreak: "break-all",
              }}
            >
              User ID: {payment.user_id}
            </p>
          </div>

          <div
            style={{
              fontWeight: 700,
              color:
  status === "pending"
    ? "#facc15"
    : status === "approved"
    ? "#4ade80"
    : "#f87171",
            }}
          >
            {status === "pending"
  ? "PENDING"
  : status === "approved"
  ? "APPROVED"
  : "REJECTED"}
          </div>
        </div>

        {/* PAYMENT DETAILS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <div>
            <small>Credits</small>

            <div>
              <strong>
                {payment.credits}
              </strong>
            </div>
          </div>

          <div>
            <small>Amount</small>

            <div>
              <strong>
                ₱
                {Number(
                  payment.peso_amount
                ).toLocaleString()}
              </strong>
            </div>
          </div>

          <div>
            <small>Payment Method</small>

            <div style={{ marginTop: "4px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  background:
                    "rgba(250, 204, 21, 0.1)",
                  color: "#facc15",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                💳{" "}
                {payment.payment_provider ||
                  "Manual"}
              </span>
            </div>
          </div>

          <div>
            <small>Payment Code</small>

            <div>
              <strong>
                {payment.payment_code ||
                  "—"}
              </strong>
            </div>
          </div>

          <div>
            <small>Submitted</small>

            <div>
              {formatDate(
                payment.created_at
              )}
            </div>
          </div>

          {status === "pending" ? (
            <div>
              <small>Expires</small>

              <div>
                {formatDate(
                  payment.expires_at
                )}
              </div>
            </div>
          ) : (
            <div>
              <small>
  {status === "approved"
    ? "Approved"
    : "Rejected"}
</small>

              <div>
                {formatDate(
                  payment.approved_at
                )}
              </div>
            </div>
          )}
        </div>

        {/* EMAIL */}

        {profile?.email && (
          <div
            style={{
              marginTop: "16px",
              opacity: 0.7,
            }}
          >
            {profile.email}
          </div>
        )}

        {/* PAYMENT ACTIONS */}

{status === "pending" && (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "20px",
      flexWrap: "wrap",
    }}
  >
    <button
      onClick={() =>
        rejectPayment(payment.id)
      }
      disabled={
        approvingId === payment.id
      }
      style={{
        padding: "12px 22px",
        borderRadius: "8px",
        border: "1px solid #7f1d1d",
        background: "#2a1111",
        color: "#f87171",
        fontWeight: 700,
        cursor:
          approvingId === payment.id
            ? "default"
            : "pointer",
      }}
    >
      {approvingId === payment.id
        ? "Processing..."
        : "✕ Reject"}
    </button>

    <button
      onClick={() =>
        approvePayment(payment.id)
      }
      disabled={
        approvingId === payment.id
      }
      style={{
        padding: "12px 22px",
        borderRadius: "8px",
        border: "none",
        background: "#14532d",
        color: "#4ade80",
        fontWeight: 700,
        cursor:
          approvingId === payment.id
            ? "default"
            : "pointer",
      }}
    >
      {approvingId === payment.id
        ? "Processing..."
        : "✓ Approve Payment"}
    </button>
  </div>
)}
      </div>
    );
  }

  return (
    <CreatorGuard>
    <main
      style={{
        padding: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            Manual Payments
          </h1>

          <p
            style={{
              marginTop: "8px",
              opacity: 0.7,
            }}
          >
            Review and approve manual credit
            purchases.
          </p>

          <a
            href="/creator"
            style={{
              display: "inline-block",
              marginTop: "14px",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "#facc15",
              color: "#000",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Back to Creator Studio
          </a>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "white",
            cursor: loading
              ? "default"
              : "pointer",
          }}
        >
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ffe5e5",
            color: "#a00000",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#e5ffe9",
            color: "#087a20",
          }}
        >
          {success}
        </div>
      )}

      {/* ========================================= */}
      {/* PENDING PAYMENTS */}
      {/* ========================================= */}

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              color: "#facc15",
            }}
          >
            🟡 Pending Payments
          </h2>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              background:
                "rgba(250, 204, 21, 0.1)",
              color: "#facc15",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            {pendingPayments.length}
          </span>
        </div>

        {!loading &&
          pendingPayments.length === 0 && (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                border: "1px solid #333",
                borderRadius: "12px",
                marginBottom: "32px",
              }}
            >
              <h3>
                No pending payments
              </h3>

              <p
                style={{
                  opacity: 0.6,
                }}
              >
                New manual payment requests
                will appear here.
              </p>
            </div>
          )}

        <div
          style={{
            display: "grid",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {pendingPayments.map(
            (payment) => (
              <PaymentCard
  key={payment.id}
  payment={payment}
  status="pending"
/>
            )
          )}
        </div>
      </section>

     {/* ========================================= */}
{/* APPROVED PAYMENTS */}
{/* ========================================= */}

<section>

<button
  type="button"
  onClick={() =>
    setShowApproved(!showApproved)
  }
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid #315a3b",
    background: "#09140d",
    color: "#4ade80",
    cursor: "pointer",
    textAlign: "left",
    marginBottom: showApproved ? "16px" : "0",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "22px",
      }}
    >
      🟢 Approved Payments
    </h2>

    <p
      style={{
        margin: "5px 0 0",
        fontSize: "13px",
        opacity: 0.6,
      }}
    >
      Completed payment requests
    </p>
  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "999px",
        background:
          "rgba(74, 222, 128, 0.1)",
        color: "#4ade80",
        fontWeight: 700,
        fontSize: "13px",
      }}
    >
      {approvedPayments.length}
    </span>

    <span style={{ fontSize: "18px" }}>
      {showApproved ? "▲" : "▼"}
    </span>
  </div>
</button>

{showApproved && (
  <>
    {!loading &&
      approvedPayments.length === 0 && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            border: "1px solid #333",
            borderRadius: "12px",
          }}
        >
          <h3>
            No approved payments yet
          </h3>

          <p
            style={{
              opacity: 0.6,
            }}
          >
            Approved payment history will
            appear here.
          </p>
        </div>
      )}

    <div
      style={{
        display: "grid",
        gap: "16px",
      }}
    >
      {approvedPayments.map(
        (payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            status="approved"
          />
        )
      )}
    </div>
  </>
)}

</section>

      {/* ========================================= */}
{/* REJECTED PAYMENTS */}
{/* ========================================= */}

<section style={{ marginTop: "40px" }}>

  <button
    type="button"
    onClick={() =>
      setShowRejected(!showRejected)
    }
    style={{
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderRadius: "12px",
      border: "1px solid #7f1d1d",
      background: "#170909",
      color: "#f87171",
      cursor: "pointer",
      textAlign: "left",
    }}
  >

    <div>
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
        }}
      >
        🔴 Rejected Payments
      </h2>

      <p
        style={{
          margin: "5px 0 0",
          fontSize: "13px",
          opacity: 0.6,
        }}
      >
        Rejected payment requests
      </p>
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "999px",
          background: "rgba(248, 113, 113, 0.1)",
          color: "#f87171",
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        {rejectedPayments.length}
      </span>

      <span
        style={{
          fontSize: "18px",
        }}
      >
        {showRejected ? "▲" : "▼"}
      </span>
    </div>

  </button>

  {showRejected && (
    <div
      style={{
        display: "grid",
        gap: "16px",
        marginTop: "16px",
      }}
    >

      {rejectedPayments.length === 0 ? (

        <div
          style={{
            padding: "30px",
            textAlign: "center",
            border: "1px solid #333",
            borderRadius: "12px",
          }}
        >
          <h3>
            No rejected payments
          </h3>

          <p
            style={{
              opacity: 0.6,
            }}
          >
            Rejected payment requests will
            appear here.
          </p>
        </div>

      ) : (

        rejectedPayments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            status="rejected"
          />
        ))

      )}

    </div>
  )}

</section>

    </main>
    </CreatorGuard>
  );
}