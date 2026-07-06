package service

import "testing"

func TestPricingAndReward(t *testing.T) {
	if got := PriceCredits(1001, 1, 10, 20); got != 12 {
		t.Fatalf("cost=%d", got)
	}
	if got := ProviderReward(12, 0.7); got != 8 {
		t.Fatalf("reward=%d", got)
	}
}
