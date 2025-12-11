package main

import (
	"log"
	"os"

	"helpdesk-backend/config"
	"helpdesk-backend/handlers"
	"helpdesk-backend/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Connect to database
	config.ConnectDatabase()

	// Create uploads directory
	os.MkdirAll("./uploads", os.ModePerm)

	// Setup Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// API routes
	api := r.Group("/api")
	{
		// Protected routes (require JWT)
		protected := api.Group("")
		protected.Use(middleware.JWTAuth())
		{
			// Tickets
			protected.GET("/tickets", handlers.GetTickets)
			protected.GET("/tickets/:id", handlers.GetTicket)
			protected.POST("/tickets", handlers.CreateTicket)
			protected.PATCH("/tickets/:id/status", handlers.UpdateTicketStatus)
			protected.POST("/tickets/:id/assign", handlers.AssignTicket)
			protected.POST("/tickets/:id/bukti-masalah", handlers.UploadBuktiMasalah)
			protected.POST("/tickets/:id/bukti-selesai", handlers.UploadBuktiSelesai)

			// Categories
			protected.GET("/categories", handlers.GetCategories)

			// Dashboard
			protected.GET("/dashboard/stats", handlers.GetDashboardStats)
			protected.GET("/dashboard/recent", handlers.GetRecentTickets)

			// Auth & Admin
			protected.GET("/auth/info", handlers.GetAuthInfo)
			protected.GET("/admin/tickets", handlers.GetAllTicketsAdmin)
			protected.GET("/admin/dashboard/stats", handlers.GetAdminDashboardStats)
			protected.PATCH("/admin/tickets/:id", handlers.UpdateTicketAdmin)
		}
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on http://localhost:%s", port)
	r.Run(":" + port)
}
