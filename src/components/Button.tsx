import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "brand" | "gold" | "violet" | "ok" | "ko" | "neutral" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  brand: "",
  gold: "btn3d--gold",
  violet: "btn3d--violet",
  ok: "btn3d--ok",
  ko: "btn3d--ko",
  neutral: "btn3d--neutral",
  ghost: "btn3d--ghost",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "btn3d--sm",
  md: "",
  lg: "btn3d--lg",
};

/** Assemble les classes du bouton en relief (voir `.btn3d` dans globals.css). */
export function buttonClass({
  variant = "brand",
  size = "md",
  block = false,
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
} = {}) {
  return [
    "btn3d",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? "btn3d--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  block,
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}) {
  return <button {...props} className={buttonClass({ variant, size, block, className })} />;
}

export function ButtonLink({
  variant,
  size,
  block,
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}) {
  return <Link {...props} className={buttonClass({ variant, size, block, className })} />;
}
