"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { TransactionStatus, TxStatus } from "@/components/ui/TransactionStatus";
import { useToast } from "@/components/ui/Toast";
import { contribute } from "@/lib/contract";
import { useAccountExists } from "@/hooks/useAccountExists";
import { useTranslations } from "next-intl";

const XLM_TO_STROOPS = 10_000_000n;
const PLEDGE_DEBOUNCE_MS = 2000;

interface PledgeModalProps {
  contractId: string;
  campaignTitle: string;
  /** Minimum contribution in stroops. */
  minContribution?: bigint;
  onClose: () => void;
  /** Called after a successful pledge so the parent can refresh stats. */
  onSuccess?: () => void;
  /** Called immediately on submit with XLM amount for optimistic UI update. */
  onOptimisticContribute?: (amountXlm: number) => void;
  /** Called on tx failure to roll back optimistic update. */
  onRollbackOptimistic?: () => void;
}

export function PledgeModal({
  contractId,
  campaignTitle,
  minContribution = 1n,
  onClose,
  onSuccess,
  onOptimisticContribute,
  onRollbackOptimistic,
}: PledgeModalProps) {
  const { address, connect, signTx, isSigning } = useWallet();
  const { exists: accountExists, loading: accountLoading } =
    useAccountExists(address);
  const { addToast } = useToast();
  const t = useTranslations("pledgeModal");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [pendingTx, setPendingTx] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "pledge-modal-title";

  // Focus trap
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const minXlm = Number(minContribution) / 1e7;

  const handlePledge = async () => {
    if (!address) {
      await connect();
      return;
    }
    if (pendingTx) return;

    const xlm = parseFloat(amount);
    if (!amount || isNaN(xlm) || xlm <= 0) {
      addToast(t("validationAmount"), "error");
      return;
    }

    const stroops = BigInt(Math.round(xlm * 1e7));
    if (stroops < minContribution) {
      addToast(t("validationMinimum", { min: minXlm }), "error");
      return;
    }

    setErrorMessage("");
    setPendingTx(true);
    setTxStatus("signing");
    onOptimisticContribute?.(xlm);

    try {
      const hash = await contribute(
        contractId,
        address,
        stroops,
        async (xdr) => {
          setTxStatus("signing");
          const signed = await signTx(xdr);
          setTxStatus("submitting");
          return signed;
        },
      );

      setTxStatus("confirming");
      setTxHash(hash);
      setTxStatus("success");
      addToast("Pledge submitted successfully!", "success", hash);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed.";
      setErrorMessage(msg);
      setTxStatus("error");
      onRollbackOptimistic?.();
      addToast(msg, "error");
    } finally {
      setPendingTx(false);
    }
  };

  const handlePledgeWithDebounce = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(handlePledge, PLEDGE_DEBOUNCE_MS);
  };

  const handleDismiss = () => {
    setTxStatus("idle");
    setTxHash("");
    setErrorMessage("");
  };

  const isProcessing = txStatus !== "idle" || pendingTx || isSigning;

  return (
    // Backdrop: closes modal on click. Keyboard dismissal (Escape) is handled by the focus trap inside the dialog.
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby={titleId}
        className="ds-card p-6 w-full max-w-md space-y-4"
      >
        <div className="flex justify-between items-center">
          <h2 id={titleId} className="text-lg font-semibold">
            {t("title", { campaignTitle })}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("close")}
            disabled={isProcessing}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {txStatus !== "idle" ? (
          <TransactionStatus
            status={txStatus}
            txHash={txHash}
            errorMessage={errorMessage}
            onDismiss={handleDismiss}
          />
        ) : (
          <>
            <div className="space-y-1">
              {address && !accountLoading && !accountExists && (
                <p className="text-xs text-yellow-400" role="alert">
                  {t("unfundedWarning")}
                </p>
              )}
              <label htmlFor="pledge-amount" className="sr-only">
                {t("amountLabel", { min: minXlm })}
              </label>
              <input
                id="pledge-amount"
                type="number"
                placeholder={t("amountPlaceholder", { min: minXlm })}
                value={amount}
                min={minXlm}
                step="0.1"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmount(e.target.value)
                }
                disabled={isProcessing}
                aria-label={t("amountLabel", { min: minXlm })}
                className="ds-input w-full px-4 py-2 disabled:opacity-50"
              />
              {minContribution > XLM_TO_STROOPS && (
                <p className="text-xs text-gray-500">
                  {t("minimumNote", { min: minXlm })}
                </p>
              )}
            </div>
            <button
              onClick={handlePledgeWithDebounce}
              disabled={isProcessing}
              aria-label={
                address
                  ? t("confirmPledgeAriaLabel", { campaignTitle })
                  : t("connectWalletAriaLabel")
              }
              className="ds-btn-primary w-full py-2"
            >
              {address ? t("confirmPledge") : t("connectWalletToPledge")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
