package handlers

import (
	"net/http"

	"helpdesk-backend/config"
	"helpdesk-backend/models"

	"github.com/gin-gonic/gin"
)

// GetCategories - Get all ticket categories
func GetCategories(c *gin.Context) {
	rows, err := config.DB.Query(`
		SELECT id, name, description FROM helpdesk_categories
	`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	categories := []models.Category{}
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.Description); err != nil {
			continue
		}
		categories = append(categories, cat)
	}

	c.JSON(http.StatusOK, categories)
}
