package metering

func EstimateTokens(text string) int {
	return EstimateTokensFromChars(len(text))
}

func EstimateTokensFromChars(chars int) int {
	if chars <= 0 {
		return 0
	}
	return (chars + 3) / 4
}

func ValidateReportedTokens(promptChars, completionChars, reportedPrompt, reportedCompletion int) (promptTokens, completionTokens int, source string) {
	promptEstimate := EstimateTokensFromChars(promptChars)
	completionEstimate := EstimateTokensFromChars(completionChars)
	if inReasonableRange(promptChars, reportedPrompt) && inReasonableRange(completionChars, reportedCompletion) {
		return reportedPrompt, reportedCompletion, "runtime_reported"
	}
	return promptEstimate, completionEstimate, "server_estimated"
}

func inReasonableRange(chars, reported int) bool {
	if chars <= 0 {
		return reported == 0
	}
	min := (chars + 7) / 8
	max := (chars+1)/2 + 100
	return reported >= min && reported <= max
}
