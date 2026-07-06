package auth

import "testing"

func TestAPIKeyHashAndFormat(t *testing.T) {
	key, prefix, publicID, err := GenerateAPIKey()
	if err != nil {
		t.Fatal(err)
	}
	if prefix == "" || publicID == "" || !ValidAPIKeyFormat(key) {
		t.Fatalf("bad key: %q %q %q", key, prefix, publicID)
	}
	if HashToken("pepper", key) != HashToken("pepper", key) {
		t.Fatal("hash must be deterministic")
	}
	if HashToken("pepper", key) == HashToken("other", key) {
		t.Fatal("pepper must affect hash")
	}
}
