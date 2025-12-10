package models

import "time"

type Ticket struct {
	ID             int        `json:"id"`
	TicketNumber   string     `json:"ticket_number"`
	UserID         string     `json:"user_id"`
	Subject        string     `json:"subject"`
	Description    string     `json:"description"`
	Status         string     `json:"status"`
	Category       string     `json:"category"`
	DikerjakanOleh *string    `json:"dikerjakan_oleh"`
	BuktiFoto      *string    `json:"bukti_foto"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	ResolvedAt     *time.Time `json:"resolved_at"`
}

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type DashboardStats struct {
	TotalTickets      int `json:"total_tickets"`
	OpenTickets       int `json:"open_tickets"`
	InProgressTickets int `json:"in_progress_tickets"`
	ResolvedTickets   int `json:"resolved_tickets"`
	ClosedTickets     int `json:"closed_tickets"`
}

type CreateTicketRequest struct {
	Subject     string `json:"subject" binding:"required"`
	Description string `json:"description" binding:"required"`
	Category    string `json:"category"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
