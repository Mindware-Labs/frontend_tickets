interface StatusBadgeProps {
  status: "Closed" | "Active" | "Paused" | "Completed"
  size?: "sm" | "md" | "lg"
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "Closed":
        return "badge-closed"
      case "Active":
        return "bg-success"
      case "Paused":
        return "bg-warning"
      case "Completed":
        return "bg-secondary"
      default:
        return "bg-secondary"
    }
  }

  return <span className={`badge ${getStatusColor()} ${size === "sm" ? "badge-sm" : ""}`}>{status}</span>
}
