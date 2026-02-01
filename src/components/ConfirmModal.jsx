export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  danger = false,
  showCancel = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />

      {/* modal */}
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-xl p-5">
        <h3 className="text-lg font-semibold mb-2">
          {title}
        </h3>

        <p className="text-sm text-neutral-600 mb-5">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border rounded-lg"
            >
              {cancelText}
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
