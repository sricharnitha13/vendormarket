package com.vendormarket.vendor_marketplace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vendormarket.vendor_marketplace.dto.ProductResponse;
import com.vendormarket.vendor_marketplace.model.Order;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.model.WishlistItem;
import com.vendormarket.vendor_marketplace.repository.OrderRepository;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import com.vendormarket.vendor_marketplace.repository.WishlistRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiRecommendationService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiRecommendationService(ProductRepository productRepository,
                                   OrderRepository orderRepository,
                                   WishlistRepository wishlistRepository,
                                   UserRepository userRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
    }

    public List<ProductResponse> getSimilarProducts(Long productId) {
        Product current = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        List<Product> candidates = productRepository.findAll().stream()
                .filter(p -> !p.getId().equals(productId))
                .filter(p -> p.getShop().getStatus() == com.vendormarket.vendor_marketplace.model.Shop.ShopStatus.APPROVED)
                .toList();

        if (candidates.isEmpty()) return List.of();

        String catalog = candidates.stream()
                .map(p -> p.getId() + ": " + p.getName() + " - " + nullSafe(p.getDescription()) + " (₹" + p.getPrice() + ")")
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
            You are a product recommendation engine for an e-commerce marketplace.
            Given a reference product and a catalog of other products (id: name - description (price)),
            return a JSON array of up to 4 product IDs from the catalog that are most similar
            or commonly bought together with the reference product.
            Respond with ONLY a JSON array of integers, e.g. [3, 7, 12]. No explanation, no markdown.
            """;

        String userPrompt = "Reference product: " + current.getName() + " - " + nullSafe(current.getDescription())
                + "\n\nCatalog:\n" + catalog;

        List<Long> ids = callGroqForIds(systemPrompt, userPrompt);
        return fetchByIds(ids);
    }

    public List<ProductResponse> getForYou(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
        List<WishlistItem> wishlist = wishlistRepository.findByUserEmail(email);

        Set<Long> excludeIds = new HashSet<>();
        StringBuilder interestBuilder = new StringBuilder();

        orders.forEach(o -> o.getItems().forEach(oi -> {
            interestBuilder.append(oi.getProduct().getName()).append(", ");
            excludeIds.add(oi.getProduct().getId());
        }));
        wishlist.forEach(w -> {
            interestBuilder.append(w.getProduct().getName()).append(", ");
            excludeIds.add(w.getProduct().getId());
        });

        if (interestBuilder.isEmpty()) {
            return List.of(); // no history yet — frontend can fall back to "popular" or hide section
        }

        List<Product> candidates = productRepository.findAll().stream()
                .filter(p -> !excludeIds.contains(p.getId()))
                .filter(p -> p.getShop().getStatus() == com.vendormarket.vendor_marketplace.model.Shop.ShopStatus.APPROVED)
                .toList();

        if (candidates.isEmpty()) return List.of();

        String catalog = candidates.stream()
                .map(p -> p.getId() + ": " + p.getName() + " - " + nullSafe(p.getDescription()) + " (₹" + p.getPrice() + ")")
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
            You are a product recommendation engine for an e-commerce marketplace.
            Given a customer's purchase/wishlist interests and a catalog of available products
            (id: name - description (price)), return a JSON array of up to 6 product IDs from the
            catalog that this customer would likely be interested in next.
            Respond with ONLY a JSON array of integers, e.g. [3, 7, 12]. No explanation, no markdown.
            """;

        String userPrompt = "Customer interests (previously bought/wishlisted): " + interestBuilder
                + "\n\nCatalog:\n" + catalog;

        List<Long> ids = callGroqForIds(systemPrompt, userPrompt);
        return fetchByIds(ids);
    }

    private List<Long> callGroqForIds(String systemPrompt, String userPrompt) {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 100,
                "temperature", 0,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            content = content.replaceAll("```json", "").replaceAll("```", "").trim();

            JsonNode arr = objectMapper.readTree(content);
            List<Long> ids = new ArrayList<>();
            arr.forEach(node -> ids.add(node.asLong()));
            return ids;
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<ProductResponse> fetchByIds(List<Long> ids) {
        return ids.stream()
                .map(productRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(p -> ProductResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription())
                        .price(p.getPrice())
                        .stock(p.getStock())
                        .imageUrl(p.getImageUrl())
                        .shopId(p.getShop().getId())
                        .shopName(p.getShop().getName())
                        .createdAt(p.getCreatedAt())
                        .build())
                .toList();
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }
}