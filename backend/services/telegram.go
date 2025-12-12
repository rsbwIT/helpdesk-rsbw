package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type TelegramMessage struct {
	ChatID    string `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode"`
}

// SendTelegramNotification sends a message to Telegram
func SendTelegramNotification(message string) error {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	chatID := os.Getenv("TELEGRAM_CHAT_ID")

	if botToken == "" || chatID == "" {
		// Skip if not configured
		return nil
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)

	msg := TelegramMessage{
		ChatID:    chatID,
		Text:      message,
		ParseMode: "HTML",
	}

	jsonData, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// NotifyNewTicket sends notification for new ticket
func NotifyNewTicket(ticketNumber, subject, category, userName string) {
	message := fmt.Sprintf(
		"🆕 <b>Tiket Baru!</b>\n\n"+
			"📋 <b>No:</b> %s\n"+
			"📝 <b>Subject:</b> %s\n"+
			"📁 <b>Kategori:</b> %s\n"+
			"👤 <b>Dari:</b> %s",
		ticketNumber, subject, category, userName,
	)
	SendTelegramNotification(message)
}

// NotifyStatusChange sends notification for status change
func NotifyStatusChange(ticketNumber, subject, oldStatus, newStatus, handledBy string) {
	statusEmoji := map[string]string{
		"dikerjakan": "🔄",
		"selesai":    "✅",
		"ditutup":    "🔒",
	}

	emoji := statusEmoji[newStatus]
	if emoji == "" {
		emoji = "📋"
	}

	message := fmt.Sprintf(
		"%s <b>Status Tiket Berubah!</b>\n\n"+
			"📋 <b>No:</b> %s\n"+
			"📝 <b>Subject:</b> %s\n"+
			"📊 <b>Status:</b> %s → <b>%s</b>\n"+
			"👷 <b>Dikerjakan:</b> %s",
		emoji, ticketNumber, subject, oldStatus, newStatus, handledBy,
	)
	SendTelegramNotification(message)
}
