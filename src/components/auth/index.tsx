import { getCurrentUser, signIn, signOut, fetchAuthSession } from "aws-amplify/auth";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthContext } from "./context";
import Login from "./ui/Login";
import { useAppStore } from "../../store";

export function Authenticator({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<string | null>(null);
  const { setUser } = useAppStore();

  useEffect(() => {
    (async () => {
      if (!authState) {
        try {
          const user = await getCurrentUser();
          const session = await fetchAuthSession();
          
          // Extract user role from token
          const groups = session.tokens?.idToken?.payload?.['cognito:groups'] || [];
          const role = Array.isArray(groups) ? String(groups[0] || 'USER') : 'USER';
          
          setUser({
            name: user.username,
            role: role,
          });
          setAuthState("authenticated");
        } catch {
          setAuthState("login");
        }
      }
    })();
  }, [authState, setUser]);

  const login = async (username: string, password: string) => {
    await signIn({ username, password });
    setAuthState(null);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setAuthState(null);
  };

  const navigate = async (state: string) => {
    setAuthState(state);
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, navigate }}>
      {authState === "authenticated" ? (
        children
      ) : authState === "login" ? (
        <Login />
      ) : (
        <LoadingIndicator />
      )}
    </AuthContext.Provider>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoaderCircle className="w-8 h-8 animate-spin text-tea-600" />
    </div>
  );
}