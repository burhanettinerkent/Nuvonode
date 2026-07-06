package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
)

func GenerateAPIKey() (plaintext, prefix, publicID string, err error) {
	prefix = randToken(6)
	secret := randToken(32)
	return fmt.Sprintf("pvn_live_%s_%s", prefix, secret), prefix, "key_" + randToken(12), nil
}

func HashToken(pepper, token string) string {
	sum := sha256.Sum256([]byte(pepper + token))
	return hex.EncodeToString(sum[:])
}

func ValidAPIKeyFormat(token string) bool {
	return strings.HasPrefix(token, "pvn_live_") && len(strings.Split(token, "_")) >= 4
}

func randToken(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

func PublicID(prefix string) string { return prefix + "_" + randToken(12) }
