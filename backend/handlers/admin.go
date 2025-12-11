package handlers

import (
	"net/http"

	"helpdesk-backend/config"

	"github.com/gin-gonic/gin"
)

type AuthResponse struct {
	UserID  string `json:"user_id"`
	Nama    string `json:"nama"`
	IsAdmin bool   `json:"is_admin"`
}

// GetAuthInfo - Get current user info including admin status
func GetAuthInfo(c *gin.Context) {
	userID := c.GetString("user_id")
	nama := c.GetString("user_nama")

	// Check if user is admin
	var count int
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_admins WHERE user_id = ?
	`, userID).Scan(&count)

	c.JSON(http.StatusOK, AuthResponse{
		UserID:  userID,
		Nama:    nama,
		IsAdmin: count > 0,
	})
}

// GetAllTicketsAdmin - Get all tickets (admin only)
func GetAllTicketsAdmin(c *gin.Context) {
	userID := c.GetString("user_id")

	// Check if admin
	var count int
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_admins WHERE user_id = ?`, userID).Scan(&count)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	rows, err := config.DB.Query(`
		SELECT id, ticket_number, user_id, subject, description, status, category, 
		       dikerjakan_oleh, bukti_masalah, bukti_selesai, created_at, updated_at, resolved_at
		FROM helpdesk_tickets 
		ORDER BY 
			CASE status 
				WHEN 'baru' THEN 1 
				WHEN 'dikerjakan' THEN 2 
				WHEN 'selesai' THEN 3 
				WHEN 'ditutup' THEN 4 
			END,
			created_at DESC
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	tickets := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var ticketNumber, userIDTicket, subject, description, status, category string
		var dikerjakanOleh, buktiMasalah, buktiSelesai *string
		var createdAt, updatedAt string
		var resolvedAt *string

		err := rows.Scan(&id, &ticketNumber, &userIDTicket, &subject, &description,
			&status, &category, &dikerjakanOleh, &buktiMasalah, &buktiSelesai,
			&createdAt, &updatedAt, &resolvedAt)
		if err != nil {
			continue
		}

		tickets = append(tickets, map[string]interface{}{
			"id":              id,
			"ticket_number":   ticketNumber,
			"user_id":         userIDTicket,
			"subject":         subject,
			"description":     description,
			"status":          status,
			"category":        category,
			"dikerjakan_oleh": dikerjakanOleh,
			"bukti_masalah":   buktiMasalah,
			"bukti_selesai":   buktiSelesai,
			"created_at":      createdAt,
			"updated_at":      updatedAt,
			"resolved_at":     resolvedAt,
		})
	}

	c.JSON(http.StatusOK, tickets)
}

// GetAdminDashboardStats - Get all tickets stats (admin only)
func GetAdminDashboardStats(c *gin.Context) {
	userID := c.GetString("user_id")

	// Check if admin
	var count int
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_admins WHERE user_id = ?`, userID).Scan(&count)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var totalTickets, openTickets, inProgressTickets, resolvedTickets, closedTickets int

	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_tickets`).Scan(&totalTickets)
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'baru'`).Scan(&openTickets)
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'dikerjakan'`).Scan(&inProgressTickets)
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'selesai'`).Scan(&resolvedTickets)
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'ditutup'`).Scan(&closedTickets)

	c.JSON(http.StatusOK, gin.H{
		"total_tickets":       totalTickets,
		"open_tickets":        openTickets,
		"in_progress_tickets": inProgressTickets,
		"resolved_tickets":    resolvedTickets,
		"closed_tickets":      closedTickets,
	})
}

// UpdateTicketAdmin - Update ticket status (admin only)
func UpdateTicketAdmin(c *gin.Context) {
	userID := c.GetString("user_id")
	nama := c.GetString("user_nama")
	ticketID := c.Param("id")

	// Check if admin
	var count int
	config.DB.QueryRow(`SELECT COUNT(*) FROM helpdesk_admins WHERE user_id = ?`, userID).Scan(&count)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If changing to "selesai", check if bukti_selesai exists
	if req.Status == "selesai" {
		var buktiSelesai *string
		config.DB.QueryRow(`SELECT bukti_selesai FROM helpdesk_tickets WHERE id = ?`, ticketID).Scan(&buktiSelesai)
		if buktiSelesai == nil || *buktiSelesai == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bukti selesai harus diupload terlebih dahulu sebelum menyelesaikan tiket"})
			return
		}
	}

	// Build update query
	query := "UPDATE helpdesk_tickets SET status = ?, dikerjakan_oleh = ?"
	args := []interface{}{req.Status, nama}

	if req.Status == "selesai" {
		query += ", resolved_at = NOW()"
	}

	query += " WHERE id = ?"
	args = append(args, ticketID)

	_, err := config.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket updated"})
}
