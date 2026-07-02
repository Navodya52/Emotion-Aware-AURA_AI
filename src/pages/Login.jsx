import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";

export default function Login() {
  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="app">
      <div className="login-card">
        <h1>AURA AI</h1>
        <p>Your Smart Personal Companion</p>
        <button onClick={login}>Sign in with Google</button>
      </div>
    </div>
  );
}