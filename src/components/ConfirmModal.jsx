export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "OK",
  danger = false,
  showCancel = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        <p className="text-sm text-neutral-600 mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-lg border"
            >
              Cancel
            </button>
          )}

          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white ${
              danger ? "bg-red-600" : "bg-black"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
