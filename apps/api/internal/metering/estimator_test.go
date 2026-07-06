package metering

import "testing"

func TestEstimateTokens(t *testing.T) {
	if got := EstimateTokens("12345"); got != 2 {
		t.Fatalf("tokens=%d", got)
	}
}

func TestValidateReportedTokensAcceptsReasonableRuntimeCounts(t *testing.T) {
	prompt, completion, source := ValidateReportedTokens(100, 40, 20, 8)
	if prompt != 20 || completion != 8 || source != "runtime_reported" {
		t.Fatalf("prompt=%d completion=%d source=%s", prompt, completion, source)
	}
}

func TestValidateReportedTokensFallsBackToServerEstimate(t *testing.T) {
	prompt, completion, source := ValidateReportedTokens(100, 40, 10000, 10000)
	if prompt != 25 || completion != 10 || source != "server_estimated" {
		t.Fatalf("prompt=%d completion=%d source=%s", prompt, completion, source)
	}
}
