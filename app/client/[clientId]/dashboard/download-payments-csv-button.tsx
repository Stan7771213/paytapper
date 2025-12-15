"use client";

type DownloadPaymentsCsvButtonProps = {
  clientId: string;
};

export function DownloadPaymentsCsvButton({ clientId }: DownloadPaymentsCsvButtonProps) {
  const safeClientId = clientId.trim();
  const href = `/api/payments/export.csv?clientId=${encodeURIComponent(safeClientId)}`;

  return (
    <a
      className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      Download CSV
    </a>
  );
}
