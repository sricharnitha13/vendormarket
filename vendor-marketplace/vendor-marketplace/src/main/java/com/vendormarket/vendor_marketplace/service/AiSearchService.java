package com.vendormarket.vendor_marketplace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vendormarket.vendor_marketplace.dto.AiSearchCriteria;
import com.vendormarket.vendor_marketplace.dto.ProductResponse;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiSearchService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiSearchService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> search(String userQuery) {
        AiSearchCriteria criteria = extractFilters(userQuery);
        System.out.println("Extracted -> keywords: " + criteria.getKeywords()
                + ", minPrice: " + criteria.getMinPrice()
                + ", maxPrice: " + criteria.getMaxPrice());

        List<Product> products = productRepository.searchWithFilters(
                criteria.getKeywords(),
                criteria.getMinPrice(),
                criteria.getMaxPrice()
        );

        return products.stream().map(p -> ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .stock(p.getStock())
                .imageUrl(p.getImageUrl())
                .build()
        ).toList();
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .shopId(product.getShop() != null ? product.getShop().getId() : null)
                .shopName(product.getShop() != null ? product.getShop().getName() : null)
                .createdAt(product.getCreatedAt())
                .build();
    }
    private AiSearchCriteria extractFilters(String userQuery) {
        String systemPrompt = """
            You are a product search assistant for an e-commerce marketplace.
            Convert the user's query into a JSON object with exactly these fields:
            keywords (string, the core product type/name to search for, or null),
            minPrice (number or null),
            maxPrice (number or null).
            Respond with ONLY valid JSON. No markdown, no explanation, no extra text.
            Example: {"keywords": "shirt", "minPrice": null, "maxPrice": 1000}
            """;

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 150,
                "temperature", 0,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userQuery)
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        AiSearchCriteria criteria = new AiSearchCriteria();
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();

            content = content.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode parsed = objectMapper.readTree(content);

            if (parsed.has("keywords") && !parsed.get("keywords").isNull()) {
                criteria.setKeywords(parsed.get("keywords").asText());
            }
            if (parsed.has("minPrice") && !parsed.get("minPrice").isNull()) {
                criteria.setMinPrice(parsed.get("minPrice").asDouble());
            }
            if (parsed.has("maxPrice") && !parsed.get("maxPrice").isNull()) {
                criteria.setMaxPrice(parsed.get("maxPrice").asDouble());
            }
        } catch (Exception e) {
            // Fallback: plain keyword search using the raw query
            criteria.setKeywords(userQuery);
        }

        return criteria;
    }
}