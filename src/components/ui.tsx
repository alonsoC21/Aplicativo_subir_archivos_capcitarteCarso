// Componentes de UI reutilizables con el estilo Carso (botones, inputs, tarjetas).

import { clsx } from "@/lib/clsx";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-carso px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-carso-teal text-white hover:bg-carso-tealDark",
    secondary:
      "bg-white text-carso-teal border border-carso-teal hover:bg-carso-bgSoft",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-carso-text hover:bg-carso-bgSoft",
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-carso border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-carso-teal focus:ring-1 focus:ring-carso-teal",
        className
      )}
      {...props}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-carso bg-white p-6 shadow-card border border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-carso-text"
    >
      {children}
    </label>
  );
}
