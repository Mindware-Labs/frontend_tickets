"use client";

import Link from "next/link";
import type { Call } from "@/lib/mock-data";

interface TicketTableProps {
  tickets: Call[];
}

export default function TicketTable({ tickets }: TicketTableProps) {
  return (
    <div className="card table-card">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Call ID</th>
                <th>Client Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-decoration-none fw-semibold"
                    >
                      {ticket.id}
                    </Link>
                  </td>
                  <td>{ticket.clientName}</td>
                  <td>
                    <small className="text-muted">{ticket.phone}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${ticket.type === "Onboarding" ? "bg-info" : "bg-warning"}`}
                    >
                      {ticket.type}
                    </span>
                  </td>
                  <td>
                    <small>{ticket.campaign}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        ticket.status === "Open"
                          ? "badge-open"
                          : ticket.status === "In Progress"
                            ? "badge-in-progress"
                            : "badge-closed"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="dropdown table-actions">
                      <button
                        className="btn btn-sm btn-light dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <Link
                            className="dropdown-item"
                            href={`/tickets/${ticket.id}`}
                          >
                            <i className="bi bi-eye me-2"></i>View Details
                          </Link>
                        </li>
                        <li>
                          <button className="dropdown-item">
                            <i className="bi bi-pencil me-2"></i>Edit
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item">
                            <i className="bi bi-check-circle me-2"></i>Mark as
                            Closed
                          </button>
                        </li>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li>
                          <button className="dropdown-item text-danger">
                            <i className="bi bi-trash me-2"></i>Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
