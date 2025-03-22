"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }

      // Auto login after successful signup
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (signInResult?.error) {
        setError("Account created but couldn't log in automatically. Please log in.");
        router.push("/login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 glass-card backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-lg shadow-lg border border-white/20 dark:border-gray-700/30">
      <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sign Up</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-400/50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="glass-input w-full px-3 py-2 border border-white/30 dark:border-gray-700/50 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="glass-input w-full px-3 py-2 border border-white/30 dark:border-gray-700/50 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="glass-input w-full px-3 py-2 border border-white/30 dark:border-gray-700/50 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="glass-input w-full px-3 py-2 border border-white/30 dark:border-gray-700/50 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="glass-button-primary w-full py-2 px-4 bg-blue-600/90 hover:bg-blue-700/90 text-white font-medium rounded-md backdrop-blur-sm border border-white/10 dark:border-blue-500/30 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
} 