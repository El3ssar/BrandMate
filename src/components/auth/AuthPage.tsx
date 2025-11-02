import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 via-brand-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Branding */}
        <div className="text-white space-y-6 hidden lg:block">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight">
              Brand Guardian AI
            </h1>
            <p className="text-2xl font-light text-brand-100">
              Your Creative Director's AI Assistant
            </p>
          </div>
          
          <div className="space-y-4 text-brand-100">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎨</div>
              <div>
                <h3 className="font-semibold text-white text-lg">Multi-Brand Management</h3>
                <p>Manage multiple brand guidelines in one place</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="font-semibold text-white text-lg">AI-Powered Auditing</h3>
                <p>Automatically review assets against brand compliance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="font-semibold text-white text-lg">Detailed Reports</h3>
                <p>Get comprehensive compliance reports with actionable feedback</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-3xl">💾</div>
              <div>
                <h3 className="font-semibold text-white text-lg">Export & Import</h3>
                <p>Easily backup and share brand configurations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Auth Form */}
        <div>
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}


