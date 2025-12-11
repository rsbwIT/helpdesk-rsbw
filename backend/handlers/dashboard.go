package handlers

import (
	"net/http"

	"helpdesk-backend/config"
	"helpdesk-backend/models"

	"github.com/gin-gonic/gin"
)

// GetDashboardStats - Get dashboard statistics
func GetDashboardStats(c *gin.Context) {
	userID := c.GetString("user_id")

	var stats models.DashboardStats

	// Total tickets
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_tickets WHERE user_id = ?
	`, userID).Scan(&stats.TotalTickets)

	// Open tickets
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_tickets WHERE user_id = ? AND status = 'baru'
	`, userID).Scan(&stats.OpenTickets)

	// In progress tickets
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_tickets WHERE user_id = ? AND status = 'dikerjakan'
	`, userID).Scan(&stats.InProgressTickets)

	// Resolved tickets
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_tickets WHERE user_id = ? AND status = 'selesai'
	`, userID).Scan(&stats.ResolvedTickets)

	// Closed tickets
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_tickets WHERE user_id = ? AND status = 'ditutup'
	`, userID).Scan(&stats.ClosedTickets)

	c.JSON(http.StatusOK, stats)
}

// GetRecentTickets - Get recent tickets for dashboard
func GetRecentTickets(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := config.DB.Query(`
		SELECT id, ticket_number, user_id, subject, description, status, category, 
		       dikerjakan_oleh, bukti_masalah, bukti_selesai, created_at, updated_at, resolved_at
		FROM helpdesk_tickets 
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT 5
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	tickets := []models.Ticket{}
	for rows.Next() {
		var t models.Ticket
		err := rows.Scan(&t.ID, &t.TicketNumber, &t.UserID, &t.Subject, &t.Description,
			&t.Status, &t.Category, &t.DikerjakanOleh, &t.BuktiMasalah, &t.BuktiSelesai,
			&t.CreatedAt, &t.UpdatedAt, &t.ResolvedAt)
		if err != nil {
			continue
		}
		tickets = append(tickets, t)
	}

	c.JSON(http.StatusOK, tickets)
}
