"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
     const [isLogin, setIsLogin] = useState(true);
     const [formData, setFormData] = useState({
          username: '',
          password: '',
          full_name: ''
     });
     const [error, setError] = useState('');
     const [loading, setLoading] = useState(false);
     const router = useRouter();

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          setError('');

          try {
               if (isLogin) {
                    // Handle Login (using form-data as required by OAuth2PasswordRequestForm)
                    const formBody = new URLSearchParams();
                    formBody.append('username', formData.username);
                    formBody.append('password', formData.password);

                    const res = await fetch('/api/v1/auth/login', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                         body: formBody
                    });

                    if (!res.ok) throw new Error('Invalid credentials');

                    const data = await res.json();
                    localStorage.setItem('token', data.access_token);
                    router.push('/');
               } else {
                    // Handle Register
                    const res = await fetch('/api/v1/auth/register', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(formData)
                    });

                    if (!res.ok) {
                         const errData = await res.json();
                         throw new Error(errData.detail || 'Registration failed');
                    }

                    setIsLogin(true);
                    alert('Registered successfully! Please login.');
               }
          } catch (err: any) {
               setError(err.message);
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4">
               <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700"
               >
                    <h1 className="text-3xl font-bold text-center mb-2 text-blue-800 dark:text-blue-400">
                         {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-center text-gray-500 mb-8">
                         {isLogin ? 'Login to access your financial profile' : 'Join FinTech-Approve to track your applications'}
                    </p>

                    {error && (
                         <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center border border-red-100">
                              {error}
                         </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                         {!isLogin && (
                              <div>
                                   <label className="text-sm font-semibold opacity-70">Full Name</label>
                                   <input
                                        type="text"
                                        required
                                        className="w-full mt-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                   />
                              </div>
                         )}
                         <div>
                              <label className="text-sm font-semibold opacity-70">Username</label>
                              <input
                                   type="text"
                                   required
                                   className="w-full mt-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                   value={formData.username}
                                   onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              />
                         </div>
                         <div>
                              <label className="text-sm font-semibold opacity-70">Password</label>
                              <input
                                   type="password"
                                   required
                                   className="w-full mt-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                   value={formData.password}
                                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              />
                         </div>

                         <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                         >
                              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                         </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                         <button
                              onClick={() => setIsLogin(!isLogin)}
                              className="text-blue-600 hover:underline font-semibold"
                         >
                              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                         </button>
                    </div>

                    <button
                         onClick={() => router.push('/')}
                         className="mt-4 w-full text-gray-400 hover:text-gray-600 text-sm"
                    >
                         ← Back to Predictor (Guest)
                    </button>
               </motion.div>
          </div>
     );
}
