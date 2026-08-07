import { Button } from "@/components/Button";

/* Champs de formulaire : surface légèrement creusée, liseré discret, anneau de
   focus net. Le même style sert aux écrans candidat et à l'administration. */
const controlClass =
  "w-full rounded-xl border border-hairline bg-surface-2 px-3.5 py-2.5 text-[0.95rem] " +
  "text-ink shadow-[inset_0_1px_2px_rgb(15_20_53_/_0.05)] transition " +
  "placeholder:text-ink-faint hover:border-hairline-strong " +
  "focus:border-brand-400 focus:bg-surface focus:outline-2 focus:outline-offset-1 focus:outline-brand-500 " +
  "aria-[invalid=true]:border-ko aria-[invalid=true]:bg-ko-soft/40";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-faint">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="flex items-start gap-1 text-xs font-medium text-ko">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`${controlClass} ${className}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && props.id ? `${props.id}-error` : undefined}
    />
  );
}

export function Textarea({
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      {...props}
      className={`${controlClass} resize-y leading-relaxed ${className}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && props.id ? `${props.id}-error` : undefined}
    />
  );
}

export function Select({
  error,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select
      {...props}
      className={`${controlClass} appearance-none bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%237d86ab'%3E%3Cpath d='M5.5 7.5 10 12l4.5-4.5' stroke='%237d86ab' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        ...props.style,
      }}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && props.id ? `${props.id}-error` : undefined}
    >
      {children}
    </select>
  );
}

/** Case à cocher alignée avec son libellé, cible tactile confortable. */
export function Checkbox({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          {...props}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md accent-[#5b63f0]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error && props.id ? `${props.id}-error` : undefined}
        />
        <span className="leading-snug">{label}</span>
      </label>
      {error ? (
        <p id={`${props.id}-error`} className="flex items-start gap-1 text-xs font-medium text-ko">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  variant = "brand",
  size = "lg",
  block = true,
}: {
  pending: boolean;
  children: React.ReactNode;
  variant?: "brand" | "gold" | "violet" | "ok" | "ko" | "neutral";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}) {
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} block={block}>
      {pending ? "Veuillez patienter…" : children}
    </Button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-ko/25 bg-ko-soft px-3.5 py-2.5 text-sm font-medium text-ko"
    >
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-xl border border-ok/25 bg-ok-soft px-3.5 py-2.5 text-sm font-medium text-ok"
    >
      <span aria-hidden="true">✓</span>
      {message}
    </p>
  );
}
