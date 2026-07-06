package service

import "testing"

func TestRoutingScoreUsesDocumentedFormula(t *testing.T) {
	trust := 80.0
	success := 0.9
	latency := 500.0
	got := RoutingScore(RouteCandidate{TrustScore: &trust, SuccessRate: &success, AverageLatencyMS: &latency, QueueDepth: 0, HeartbeatAgeSeconds: 10})
	want := 80*0.35 + 90*0.25 + 90*0.20 + 100*0.10 + 100*0.10
	if got != want {
		t.Fatalf("score=%v want=%v", got, want)
	}
}

func TestRoutingTiePrefersFewerJobs(t *testing.T) {
	a := RouteCandidate{HeartbeatAgeSeconds: 10, TotalJobs: 1}
	b := RouteCandidate{HeartbeatAgeSeconds: 10, TotalJobs: 2}
	if !PreferRoute(a, b) {
		t.Fatal("expected fewer total jobs to win tie")
	}
}
