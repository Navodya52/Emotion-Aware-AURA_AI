import { FaMicrophone, FaStop } from "react-icons/fa";

export default function VoiceButton({ listening, startListening }) {
  return (
    <button
      onClick={startListening}
      className="voice-btn"
    >
      {listening ? <FaStop /> : <FaMicrophone />}
    </button>
  );
}