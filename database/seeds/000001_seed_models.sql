-- Seed models are examples. Operators can edit runtime_model_name according to local Ollama tags.

INSERT INTO models (
    public_id, slug, display_name, description, family, modality, status,
    context_length, default_max_output_tokens, input_credit_per_1k, output_credit_per_1k,
    provider_reward_ratio, min_vram_mb, recommended_vram_mb, license_name, license_notes,
    community_allowed, external_only
) VALUES
('mdl_qwen_7b', 'qwen-7b-instruct', 'Qwen 7B Instruct', 'General small open chat model for V1 community providers.', 'qwen', 'text', 'active', 8192, 1024, 10, 20, 0.7000, 8192, 12288, 'operator_check_required', 'Verify model license before public commercial use.', true, false),
('mdl_code_7b', 'code-7b-instruct', 'Code 7B Instruct', 'Small coding assistant model for V1.', 'code', 'text', 'active', 8192, 1024, 12, 24, 0.7000, 8192, 12288, 'operator_check_required', 'Verify model license before public commercial use.', true, false),
('mdl_embed_small', 'embed-small', 'Embedding Small', 'Lightweight embedding model for future V1.1 embedding endpoint.', 'embedding', 'embedding', 'paused', 2048, 0, 2, 0, 0.7000, 4096, 8192, 'operator_check_required', 'Embeddings endpoint can be implemented after chat V1.', true, false),
('mdl_external_large', 'external-large-placeholder', 'External Large Placeholder', 'Disabled placeholder for optional external paid connector. Not active in V1 by default.', 'external', 'text', 'paused', 32768, 2048, 100, 300, 0.0000, 0, 0, 'external_provider_terms', 'Only enable if the operator has budget and accepts external provider terms.', false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO model_versions (public_id, model_id, version_label, runtime, runtime_model_name, quantization, parameters_billion, status)
SELECT 'mdv_qwen_7b_ollama', id, 'ollama-default', 'ollama', 'qwen-7b-instruct', 'operator_configured', 7.00, 'active'
FROM models WHERE slug = 'qwen-7b-instruct'
ON CONFLICT DO NOTHING;

INSERT INTO model_versions (public_id, model_id, version_label, runtime, runtime_model_name, quantization, parameters_billion, status)
SELECT 'mdv_code_7b_ollama', id, 'ollama-default', 'ollama', 'code-7b-instruct', 'operator_configured', 7.00, 'active'
FROM models WHERE slug = 'code-7b-instruct'
ON CONFLICT DO NOTHING;
