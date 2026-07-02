export default function SettingsModal({
  onClose,
  dark,
  setDark,
  exportPdf,
  exportWord,
  clearChat,
}) {
  return (
    <div className="modal-bg">
      <div className="settings-modal">
        <h2>⚙️ AURA Settings</h2>

        <button onClick={() => setDark(!dark)}>
          {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <button onClick={exportPdf}>📄 Export PDF</button>
        <button onClick={exportWord}>📝 Export Word</button>
        <button onClick={clearChat}>🧹 Clear Current Chat</button>

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}