import { useSearchParams } from "react-router-dom";
import { apiUrls } from "../utils/apiUrls";

const Login = () => {
  const [params] = useSearchParams();
  const error = params.get("error");

  const handleGoogleLogin = () => {
    window.location.assign(apiUrls.googleLogin);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0A12] px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#211F2E] bg-[#13111C] p-8 shadow-xl shadow-black/40">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#96939F]">Welcome</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#F3F1F7]">
            Chat Application
          </h1>
          <p className="mt-3 text-sm text-[#96939F]">
            Sign in to continue to your dashboard.
          </p>
        </div>

        {error && (
          <p className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          className="flex w-full items-center justify-center gap-3 rounded-md border border-[#2A2838] bg-[#1B1A29] px-4 py-3 text-sm font-medium text-[#F3F1F7] transition hover:bg-[#211F30]"
          type="button"
          onClick={handleGoogleLogin}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2A2838] text-sm font-semibold text-[#F3F1F7]">
            G
          </span>
          Continue with Google
        </button>
      </section>
    </main>
  );
};

export default Login;
