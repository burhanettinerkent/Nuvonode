package httpx

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/nuvonode/nuvonode/apps/api/internal/repository"
	"github.com/nuvonode/nuvonode/apps/api/internal/service"
)

type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}
type ErrorDetail struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id"`
}

func RequestID(c *fiber.Ctx) string {
	if v, ok := c.Locals("request_id").(string); ok {
		return v
	}
	return "req_unknown"
}

func Error(c *fiber.Ctx, status int, code, message string) error {
	return c.Status(status).JSON(fiber.Map{"error": fiber.Map{"code": code, "message": message, "request_id": RequestID(c)}})
}

func Handle(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, repository.ErrNotFound) {
		return Error(c, fiber.StatusNotFound, "not_found", "Resource not found.")
	}
	if errors.Is(err, service.ErrInvalidInput) {
		return Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	if errors.Is(err, service.ErrInvalidCredentials) {
		return Error(c, fiber.StatusUnauthorized, "unauthorized", "Invalid credentials.")
	}
	if errors.Is(err, service.ErrForbidden) {
		return Error(c, fiber.StatusForbidden, "forbidden", "Admin access required.")
	}
	if errors.Is(err, service.ErrInsufficientCredits) {
		return Error(c, fiber.StatusPaymentRequired, "insufficient_credits", "The project does not have enough credits for this request.")
	}
	if strings.Contains(err.Error(), "duplicate key") {
		return Error(c, fiber.StatusBadRequest, "invalid_request", "Resource already exists.")
	}
	return Error(c, fiber.StatusInternalServerError, "internal_error", "Internal server error.")
}
