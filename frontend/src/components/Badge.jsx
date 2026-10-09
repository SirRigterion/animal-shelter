// src/components/Badge.jsx
// Переиспользуемый бейдж статуса и категории

export default function Badge({
  children,
  variant = "default",
  className = ""
}) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
}
