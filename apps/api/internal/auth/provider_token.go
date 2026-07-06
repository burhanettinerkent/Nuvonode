package auth

import "fmt"

func GenerateProviderToken() (plaintext, prefix, publicID string, err error) {
	prefix = randToken(6)
	secret := randToken(32)
	return fmt.Sprintf("pvn_provider_%s_%s", prefix, secret), prefix, "prv_" + randToken(12), nil
}
