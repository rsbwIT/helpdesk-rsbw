package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"helpdesk-backend/config"
	"helpdesk-backend/models"

	"github.com/gin-gonic/gin"
)

// GetTickets - Get all tickets for current user
func GetTickets(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := config.DB.Query(`
		SELECT id, ticket_number, user_id, subject, description, status, category, 
		       dikerjakan_oleh, bukti_foto, created_at, updated_at, resolved_at
		FROM helpdesk_tickets 
		WHERE user_id = ?
		ORDER BY created_at DESC
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
			&t.Status, &t.Category, &t.DikerjakanOleh, &t.BuktiFoto,
			&t.CreatedAt, &t.UpdatedAt, &t.ResolvedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		tickets = append(tickets, t)
	}

	c.JSON(http.StatusOK, tickets)
}

// GetTicket - Get single ticket by ID
func GetTicket(c *gin.Context) {
	userID := c.GetString("user_id")
	ticketID := c.Param("id")

	var t models.Ticket
	err := config.DB.QueryRow(`
		SELECT id, ticket_number, user_id, subject, description, status, category, 
		       dikerjakan_oleh, bukti_foto, created_at, updated_at, resolved_at
		FROM helpdesk_tickets 
		WHERE id = ? AND user_id = ?
	`, ticketID, userID).Scan(&t.ID, &t.TicketNumber, &t.UserID, &t.Subject, &t.Description,
		&t.Status, &t.Category, &t.DikerjakanOleh, &t.BuktiFoto,
		&t.CreatedAt, &t.UpdatedAt, &t.ResolvedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, t)
}

// CreateTicket - Create a new ticket
func CreateTicket(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate ticket number
	ticketNumber := generateTicketNumber()

	// Insert ticket
	result, err := config.DB.Exec(`
		INSERT INTO helpdesk_tickets (ticket_number, user_id, subject, description, category, status)
		VALUES (?, ?, ?, ?, ?, 'baru')
	`, ticketNumber, userID, req.Subject, req.Description, req.Category)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()

	// Return created ticket
	var t models.Ticket
	config.DB.QueryRow(`
		SELECT id, ticket_number, user_id, subject, description, status, category, 
		       dikerjakan_oleh, bukti_foto, created_at, updated_at, resolved_at
		FROM helpdesk_tickets WHERE id = ?
	`, id).Scan(&t.ID, &t.TicketNumber, &t.UserID, &t.Subject, &t.Description,
		&t.Status, &t.Category, &t.DikerjakanOleh, &t.BuktiFoto,
		&t.CreatedAt, &t.UpdatedAt, &t.ResolvedAt)

	c.JSON(http.StatusCreated, t)
}

// UpdateTicketStatus - Update ticket status
func UpdateTicketStatus(c *gin.Context) {
	ticketID := c.Param("id")

	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update status
	query := "UPDATE helpdesk_tickets SET status = ?"
	args := []interface{}{req.Status}

	// If resolved, set resolved_at
	if req.Status == "selesai" {
		query += ", resolved_at = ?"
		args = append(args, time.Now())
	}

	query += " WHERE id = ?"
	args = append(args, ticketID)

	_, err := config.DB.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}

// generateTicketNumber - Generate unique ticket number
func generateTicketNumber() string {
	now := time.Now()

	// Get count of today's tickets
	var count int
	config.DB.QueryRow(`
		SELECT COUNT(*) FROM helpdesk_tickets 
		WHERE DATE(created_at) = CURDATE()
	`).Scan(&count)

	return fmt.Sprintf("HD-%s-%03d", now.Format("20060102"), count+1)
}

// GetAllTickets - Get all tickets (for admin)
func GetAllTickets(c *gin.Context) {
	rows, err := config.DB.Query(`
		SELECT id, ticket_number, user_id, subject, description, status, category, 
		       dikerjakan_oleh, bukti_foto, created_at, updated_at, resolved_at
		FROM helpdesk_tickets 
		ORDER BY created_at DESC
		LIMIT 100
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	tickets := []models.Ticket{}
	for rows.Next() {
		var t models.Ticket
		err := rows.Scan(&t.ID, &t.TicketNumber, &t.UserID, &t.Subject, &t.Description,
			&t.Status, &t.Category, &t.DikerjakanOleh, &t.BuktiFoto,
			&t.CreatedAt, &t.UpdatedAt, &t.ResolvedAt)
		if err != nil {
			continue
		}
		tickets = append(tickets, t)
	}

	c.JSON(http.StatusOK, tickets)
}

// AssignTicket - Assign ticket to staff
func AssignTicket(c *gin.Context) {
	ticketID := c.Param("id")
	staffName := c.GetString("user_nama")

	_, err := config.DB.Exec(`
		UPDATE helpdesk_tickets 
		SET dikerjakan_oleh = ?, status = 'dikerjakan'
		WHERE id = ?
	`, staffName, ticketID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket assigned"})
}

// UploadBukti - Upload proof of work
func UploadBukti(c *gin.Context) {
	ticketID := c.Param("id")

	file, err := c.FormFile("bukti")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File required"})
		return
	}

	// Generate filename
	filename := fmt.Sprintf("bukti_%s_%d%s", ticketID, time.Now().Unix(), getFileExtension(file.Filename))

	// Save file
	if err := c.SaveUploadedFile(file, "./uploads/"+filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update database
	_, err = config.DB.Exec(`
		UPDATE helpdesk_tickets SET bukti_foto = ? WHERE id = ?
	`, filename, ticketID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"filename": filename})
}

func getFileExtension(filename string) string {
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			return filename[i:]
		}
	}
	return ""
}

// ParseInt helper
func ParseInt(s string) int {
	i, _ := strconv.Atoi(s)
	return i
}
