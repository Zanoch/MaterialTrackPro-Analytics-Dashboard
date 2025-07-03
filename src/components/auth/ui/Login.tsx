import { useState } from "react";
import { useAuthenticator } from "../context";
import { Leaf, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Label } from "../../ui/Label";

export default function Login() {
  const { login } = useAuthenticator();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) setError("");
    
    try {
      setLoading(true);
      await login(username, password);
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle specific Cognito errors
      let errorMessage = err.name || "An error occurred";
      switch (errorMessage) {
        case "UserNotFoundException":
        case "NotAuthorizedException":
          errorMessage = "Incorrect username or password. Please try again.";
          break;
        case "TooManyRequestsException":
          errorMessage = "Too many requests. Please wait a few minutes.";
          break;
        case "InternalErrorException":
          errorMessage = "Something went wrong. Please try again.";
          break;
        default:
          errorMessage = err.message || "Failed to sign in";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tea-50 to-tea-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-tea-100 rounded-full mb-4">
            <Leaf className="h-10 w-10 text-tea-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tea Management Platform</h1>
          <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tea-600 hover:bg-tea-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tea-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}