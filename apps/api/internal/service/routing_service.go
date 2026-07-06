package service

import "math"

type RouteCandidate struct {
	TrustScore          *float64
	SuccessRate         *float64
	AverageLatencyMS    *float64
	QueueDepth          int
	HeartbeatAgeSeconds int
	TotalJobs           int64
}

func RoutingScore(c RouteCandidate) float64 {
	trustScore := valueOr(c.TrustScore, 20)
	successScore := valueOr(c.SuccessRate, 0.5) * 100
	latencyScore := clamp(100-valueOr(c.AverageLatencyMS, 2500)/50, 0, 100)
	capacityScore := 100.0
	if c.QueueDepth > 0 {
		capacityScore = clamp(100-float64(c.QueueDepth)*50, 0, 100)
	}
	freshnessScore := 0.0
	if c.HeartbeatAgeSeconds <= 15 {
		freshnessScore = 100
	} else if c.HeartbeatAgeSeconds <= 30 {
		freshnessScore = 50
	}
	return trustScore*0.35 + successScore*0.25 + latencyScore*0.20 + capacityScore*0.10 + freshnessScore*0.10
}

func PreferRoute(a, b RouteCandidate) bool {
	aScore := RoutingScore(a)
	bScore := RoutingScore(b)
	if aScore == bScore {
		return a.TotalJobs < b.TotalJobs
	}
	return aScore > bScore
}

func valueOr(v *float64, fallback float64) float64 {
	if v == nil || math.IsNaN(*v) {
		return fallback
	}
	return *v
}

func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}
