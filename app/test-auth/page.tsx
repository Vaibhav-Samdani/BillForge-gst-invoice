"use client"

import { useState } from "react"
import { LoginForm, RegisterForm, PasswordResetForm } from "@/components/auth"
import { Button } from "@/components/ui/button"

export default function TestAuthPage() {
  const [activeForm, setActiveForm] = useState<"login" | "register" | "reset">("login")

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Authentication Components Test
          </h1>
          <p className="text-gray-600">
            Test the authentication components functionality
          </p>
        </div>

        {/* Form selector */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            onClick={() => setActiveForm("login")}
            variant={activeForm === "login" ? "default" : "outline"}
          >
            Login Form
          </Button>
          <Button
            onClick={() => setActiveForm("register")}
            variant={activeForm === "register" ? "default" : "outline"}
          >
            Register Form
          </Button>
          <Button
            onClick={() => setActiveForm("reset")}
            variant={activeForm === "reset" ? "default" : "outline"}
          >
            Password Reset
          </Button>
        </div>

        {/* Form container */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          {activeForm === "login" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Login Form Test</h2>
              <LoginForm
                onSuccess={() => alert("Login successful!")}
                className="space-y-4"
              />
            </div>
          )}

          {activeForm === "register" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Register Form Test</h2>
              <RegisterForm
                onSuccess={() => alert("Registration successful!")}
                className="space-y-4"
              />
            </div>
          )}

          {activeForm === "reset" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Password Reset Test</h2>
              <PasswordResetForm
                onSuccess={() => alert("Password reset successful!")}
                className="space-y-4"
              />
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Reset with token test:</strong>
                </p>
                <Button
                  onClick={() => setActiveForm("reset")}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Test with token
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Component features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-3">LoginForm Features</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Email/password validation</li>
              <li>✅ Show/hide password toggle</li>
              <li>✅ Loading states</li>
              <li>✅ Error handling</li>
              <li>✅ NextAuth integration</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-3">RegisterForm Features</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Real-time password validation</li>
              <li>✅ Password confirmation</li>
              <li>✅ Email verification</li>
              <li>✅ Company field (optional)</li>
              <li>✅ Form validation</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-3">PasswordResetForm Features</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Email request mode</li>
              <li>✅ Token reset mode</li>
              <li>✅ Password strength validation</li>
              <li>✅ Secure token handling</li>
              <li>✅ Success/error feedback</li>
            </ul>
          </div>
        </div>

        {/* API endpoints info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-3">API Endpoints</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Registration:</strong>
              <br />
              <code className="text-blue-600">POST /api/auth/register</code>
            </div>
            <div>
              <strong>Forgot Password:</strong>
              <br />
              <code className="text-blue-600">POST /api/auth/forgot-password</code>
            </div>
            <div>
              <strong>Reset Password:</strong>
              <br />
              <code className="text-blue-600">POST /api/auth/reset-password</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}