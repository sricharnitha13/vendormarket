package com.vendormarket.vendor_marketplace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vendormarket.vendor_marketplace.dto.ChatMessageDto;
import com.vendormarket.vendor_marketplace.dto.ChatRequest;
import com.vendormarket.vendor_marketplace.dto.ChatResponse;
import com.vendormarket.vendor_marketplace.dto.OrderResponse;
import com.vendormarket.vendor_marketplace.dto.ProductResponse;
import com.vendormarket.vendor_marketplace.dto.ShopResponse;
import com.vendormarket.vendor_marketplace.model.Cart;
import com.vendormarket.vendor_marketplace.model.CartItem;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.CartRepository;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final ProductRepository productRepository;
    private final OrderService orderService;
    private final ShopService shopService;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatService(ProductRepository productRepository, OrderService orderService, ShopService shopService,
                       CartRepository cartRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.orderService = orderService;
        this.shopService = shopService;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
    }

    // Only the categorical bucket and, for ADD_TO_CART/ORDER_STATUS, the entity reference come from
    // the LLM. Keywords and prices are NEVER trusted from the model — small models are unreliable at
    // numeric extraction (confusing "under" with "over", inventing numbers from messages with no
    // digits at all). Those are parsed deterministically below instead.
    private record Intent(String intent, Long orderId, String productQuery) {}

    private record ParsedQuery(String keyword, Double minPrice, Double maxPrice) {}

    public ChatResponse chat(String email, ChatRequest request) {
        String message = request.getMessage() == null ? "" : request.getMessage().trim();
        if (message.isEmpty()) {
            return ChatResponse.builder().reply("Could you tell me what you're looking for?").build();
        }

        // Heuristic shortcuts — deterministic and immune to LLM flakiness or conversation-history
        // carryover. These cover the common, high-stakes cases before the LLM is even consulted.
        if (looksLikeCartView(message)) {
            return handleCartView(email);
        }
        if (looksLikeShopList(message)) {
            Optional<ShopResponse> mentionedShop = findMentionedShop(message);
            return mentionedShop.map(this::handleShopProducts).orElseGet(this::handleShopList);
        }

        ParsedQuery parsed = parsePriceAndKeyword(message);
        boolean hasPriceSignal = parsed.minPrice() != null || parsed.maxPrice() != null;
        boolean isGenericOrEmptyKeyword = parsed.keyword() == null;
        if (hasPriceSignal || (isGenericOrEmptyKeyword && looksLikeBareGenericBrowse(message))) {
            return handleSearch(parsed.keyword(), parsed.minPrice(), parsed.maxPrice());
        }

        List<ChatMessageDto> history = trimHistory(request.getHistory());

        try {
            Intent intent = classifyIntent(message, history);
            return switch (intent.intent()) {
                case "SEARCH" -> handleSearch(parsed.keyword(), parsed.minPrice(), parsed.maxPrice());
                case "ORDER_STATUS" -> handleOrderStatus(email, intent.orderId());
                case "ADD_TO_CART" -> handleAddToCart(intent.productQuery() != null ? intent.productQuery() : message);
                case "SHOP_LIST" -> handleShopList();
                case "CART_VIEW" -> handleCartView(email);
                default -> handleGeneral(message, history);
            };
        } catch (Exception e) {
            return ChatResponse.builder()
                    .reply("Sorry, something went wrong on my end. Could you try asking that again?")
                    .build();
        }
    }

    // --- Heuristic shortcuts -----------------------------------------------------

    private static final Set<String> SHOP_WORDS = Set.of("shop", "shops", "store", "stores", "vendor", "vendors");
    private static final Set<String> DERAILING_WORDS = Set.of("order", "cart", "buy", "add", "purchase");

    private boolean looksLikeShopList(String message) {
        String lower = message.toLowerCase();
        boolean mentionsShop = SHOP_WORDS.stream().anyMatch(lower::contains);
        boolean mentionsOther = DERAILING_WORDS.stream().anyMatch(lower::contains);
        return mentionsShop && !mentionsOther;
    }

    private boolean looksLikeCartView(String message) {
        String lower = message.toLowerCase();
        boolean mentionsCart = lower.contains("cart");
        boolean mentionsAdd = lower.contains("add") || lower.contains("buy");
        return mentionsCart && !mentionsAdd;
    }

    private boolean looksLikeBareGenericBrowse(String message) {
        String stripped = FILLER_PATTERN.matcher(message.toLowerCase()).replaceAll(" ").trim().replaceAll("\\s+", " ");
        return stripped.isEmpty() || GENERIC_SEARCH_TERMS.contains(stripped);
    }

    // --- Deterministic price + keyword extraction ---------------------------------

    private static final Pattern MAX_PRICE_PATTERN = Pattern.compile(
            "\\b(?:under|below|less than|cheaper than|up to|within)\\s*(?:rs\\.?|inr|₹)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:rs\\.?|inr|₹|rupees)?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern MIN_PRICE_PATTERN = Pattern.compile(
            "\\b(?:over|above|more than|starting from|at\\s*least)\\s*(?:rs\\.?|inr|₹)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:rs\\.?|inr|₹|rupees)?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern BARE_PRICE_PATTERN = Pattern.compile(
            "(?:rs\\.?|inr|₹)\\s*(\\d+(?:\\.\\d+)?)|(\\d+(?:\\.\\d+)?)\\s*(?:rs\\.?|inr|₹|rupees)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern FILLER_PATTERN = Pattern.compile(
            "\\b(show me|give me|find me|find|search for|do you have|any|i want|i'd like|looking for|" +
                    "please|some|of|for|with|the|a|an|me|affordable|cheap|cheapest|best|good|quality|nice|top)\\b",
            Pattern.CASE_INSENSITIVE);

    private ParsedQuery parsePriceAndKeyword(String message) {
        String working = message.toLowerCase();
        Double maxPrice = null;
        Double minPrice = null;

        Matcher maxMatcher = MAX_PRICE_PATTERN.matcher(working);
        if (maxMatcher.find()) {
            maxPrice = Double.parseDouble(maxMatcher.group(1));
            working = maxMatcher.replaceFirst(" ");
        }

        Matcher minMatcher = MIN_PRICE_PATTERN.matcher(working);
        if (minMatcher.find()) {
            minPrice = Double.parseDouble(minMatcher.group(1));
            working = minMatcher.replaceFirst(" ");
        }

        if (minPrice == null && maxPrice == null) {
            Matcher bareMatcher = BARE_PRICE_PATTERN.matcher(working);
            if (bareMatcher.find()) {
                // A bare price with no direction word ("chocolates of 100rs") is treated as a
                // ceiling — the common-sense reading for a budget mentioned without "over"/"under".
                String numStr = bareMatcher.group(1) != null ? bareMatcher.group(1) : bareMatcher.group(2);
                maxPrice = Double.parseDouble(numStr);
                working = bareMatcher.replaceFirst(" ");
            }
        }

        working = FILLER_PATTERN.matcher(working).replaceAll(" ");
        working = working.replaceAll("[^a-z0-9\\s]", " ");
        working = working.trim().replaceAll("\\s+", " ");

        String keyword = normalizeSearchQuery(working.isBlank() ? null : working);
        return new ParsedQuery(keyword, minPrice, maxPrice);
    }

    // --- Intent classification (bucket only — no numbers, no keywords) -----------

    private Intent classifyIntent(String message, List<ChatMessageDto> history) {
        String systemPrompt = """
            You are an intent classifier for a shopping assistant on an e-commerce marketplace called VendorMarket.
            Classify the user's LATEST message into exactly one category. Respond with ONLY a JSON object in this
            exact shape, no markdown, no explanation:
            {"intent": "SEARCH" | "ORDER_STATUS" | "ADD_TO_CART" | "SHOP_LIST" | "CART_VIEW" | "GENERAL", "orderId": number or null, "productQuery": string or null}

            Rules:
            - Classify based primarily on the LATEST message. Only use conversation history to resolve a message
              that is clearly a follow-up to the immediately preceding turn. Do not carry over a topic from
              earlier messages into a new, unrelated message.
            - SEARCH: the user wants to find or browse products, with or without a price mention.
            - ORDER_STATUS: the user is asking about an existing order (e.g. "where is my order", "status of order 42").
              Set orderId if a specific number is mentioned, else null.
            - ADD_TO_CART: the user explicitly wants to buy or add a specific product (e.g. "add a blue t-shirt to my cart").
              Set productQuery to the product name/description they mentioned.
            - SHOP_LIST: the user wants to see the list of shops/stores on the marketplace.
            - CART_VIEW: the user is asking what's currently in their cart.
            - GENERAL: greetings, thanks, or anything that doesn't clearly fit the above.
            """;

        String context = history.stream()
                .map(h -> h.getRole() + ": " + h.getContent())
                .collect(Collectors.joining("\n"));
        String userPrompt = (context.isBlank() ? "" : "Earlier conversation (for follow-up context only):\n" + context + "\n\n")
                + "Latest message to classify: " + message;

        try {
            JsonNode node = callGroqJson(systemPrompt, userPrompt);
            String intentValue = node.path("intent").asText("GENERAL");
            String productQuery = node.path("productQuery").isNull() ? null : node.path("productQuery").asText(null);
            Long orderId = (node.path("orderId").isNull() || !node.path("orderId").isNumber())
                    ? null : node.path("orderId").asLong();
            return new Intent(intentValue, orderId, productQuery);
        } catch (Exception e) {
            return new Intent("GENERAL", null, null);
        }
    }

    // --- Intent handlers ---------------------------------------------------------

    private static final Set<String> GENERIC_SEARCH_TERMS = Set.of(
            "product", "products", "item", "items", "thing", "things", "stuff",
            "anything", "everything", "something", "all", "available"
    );

    private ChatResponse handleSearch(String query, Double minPrice, Double maxPrice) {
        List<Product> matches = findProducts(query, minPrice, maxPrice, 8);
        String reply = buildSearchReply(query, minPrice, maxPrice, matches.isEmpty());
        return ChatResponse.builder().reply(reply).products(toProductResponses(matches)).build();
    }

    private String buildSearchReply(String query, Double minPrice, Double maxPrice, boolean empty) {
        String priceSuffix = "";
        if (maxPrice != null && minPrice != null) {
            priceSuffix = " between ₹" + trimPrice(minPrice) + " and ₹" + trimPrice(maxPrice);
        } else if (maxPrice != null) {
            priceSuffix = " under ₹" + trimPrice(maxPrice);
        } else if (minPrice != null) {
            priceSuffix = " over ₹" + trimPrice(minPrice);
        }

        if (empty) {
            if (query != null) {
                return "I couldn't find anything matching \"" + query + "\"" + priceSuffix + ". Try different keywords?";
            }
            return "I couldn't find anything" + priceSuffix + " right now. Try a different price range?";
        }

        if (query != null) {
            return "Here are a few things I found for \"" + query + "\"" + priceSuffix + ":";
        }
        if (!priceSuffix.isEmpty()) {
            return "Here's what's available" + priceSuffix + ":";
        }
        return "Here's a selection of what's available right now:";
    }

    private String trimPrice(double price) {
        return price == Math.floor(price) ? String.valueOf((long) price) : String.valueOf(price);
    }

    private ChatResponse handleShopList() {
        List<ShopResponse> shops = shopService.getApprovedShops();
        if (shops.isEmpty()) {
            return ChatResponse.builder().reply("There aren't any approved shops yet — check back soon!").build();
        }
        List<ShopResponse> limited = shops.size() > 8 ? shops.subList(0, 8) : shops;
        return ChatResponse.builder().reply("Here are the shops on VendorMarket:").shops(limited).build();
    }

    // If the message names a real shop (e.g. "what does GKMS have"), show that shop's products
    // instead of the full directory — otherwise "store"/"shop" mentions default to the listing.
    private Optional<ShopResponse> findMentionedShop(String message) {
        String lower = message.toLowerCase();
        return shopService.getApprovedShops().stream()
                .filter(s -> s.getName() != null && lower.contains(s.getName().toLowerCase()))
                .findFirst();
    }

    private ChatResponse handleShopProducts(ShopResponse shop) {
        List<Product> shopProducts = productRepository.findAll().stream()
                .filter(p -> p.getShop().getId().equals(shop.getId()))
                .limit(8)
                .toList();
        if (shopProducts.isEmpty()) {
            return ChatResponse.builder().reply(shop.getName() + " doesn't have any products listed yet.").build();
        }
        return ChatResponse.builder()
                .reply("Here's what " + shop.getName() + " has:")
                .products(toProductResponses(shopProducts))
                .build();
    }

    // Reads the customer's actual cart — deliberately read-only, no mutation here, reusing only
    // Cart/CartItem access patterns already confirmed working in OrderService.
    private ChatResponse handleCartView(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ChatResponse.builder().reply("I couldn't find your account — try logging in again.").build();
        }

        Optional<Cart> cartOpt = cartRepository.findByUser(userOpt.get());
        if (cartOpt.isEmpty() || cartOpt.get().getItems().isEmpty()) {
            return ChatResponse.builder().reply("Your cart is empty right now.").build();
        }

        List<CartItem> items = cartOpt.get().getItems();
        double total = items.stream().mapToDouble(ci -> ci.getProduct().getPrice() * ci.getQuantity()).sum();
        String itemsDesc = items.stream()
                .map(ci -> ci.getQuantity() + "x " + ci.getProduct().getName())
                .collect(Collectors.joining(", "));
        String reply = "Here's what's in your cart: " + itemsDesc + ". Total: ₹" + String.format("%.2f", total) + ".";

        List<Product> products = items.stream().map(CartItem::getProduct).distinct().toList();
        return ChatResponse.builder().reply(reply).products(toProductResponses(products)).build();
    }

    private String normalizeSearchQuery(String query) {
        if (query == null) return null;
        String trimmed = query.trim();
        if (trimmed.isEmpty()) return null;
        if (GENERIC_SEARCH_TERMS.contains(trimmed.toLowerCase())) return null;
        return trimmed;
    }

    private ChatResponse handleOrderStatus(String email, Long orderId) {
        List<OrderResponse> orders = orderService.getMyOrders(email);
        if (orders.isEmpty()) {
            return ChatResponse.builder().reply("You don't have any orders yet.").build();
        }

        List<OrderResponse> relevant;
        String reply;
        if (orderId != null) {
            relevant = orders.stream().filter(o -> o.getId().equals(orderId)).toList();
            reply = relevant.isEmpty()
                    ? "I couldn't find an order with that number on your account."
                    : "Here's what I found:";
        } else {
            relevant = orders.stream().limit(3).toList(); // already sorted most-recent-first
            reply = "Here are your most recent orders:";
        }
        return ChatResponse.builder().reply(reply).orders(relevant).build();
    }

    // Resolves a likely product match and hands it back as a card; the actual
    // cart mutation happens client-side via the existing /cart/add endpoint
    // rather than this service touching Cart/CartItem directly.
    private ChatResponse handleAddToCart(String productQuery) {
        List<Product> matches = findProducts(productQuery, null, null, 1);
        if (matches.isEmpty()) {
            return ChatResponse.builder()
                    .reply("I couldn't find a product matching \"" + productQuery + "\". Could you describe it differently?")
                    .build();
        }
        Product match = matches.get(0);
        String reply = "I found \"" + match.getName() + "\" for ₹" + match.getPrice()
                + ". Tap Add to Cart below if that's the one.";
        return ChatResponse.builder().reply(reply).products(toProductResponses(matches)).build();
    }

    private ChatResponse handleGeneral(String message, List<ChatMessageDto> history) {
        String systemPrompt = """
            You are the friendly shopping assistant for the VendorMarket marketplace.
            Keep replies short (1-3 sentences), warm, and helpful. If the user seems to want to find
            products, check an order, see what shops are available, or see what's in their cart, gently
            suggest they ask directly (e.g. "try asking me to find something, like 'show me running shoes'").
            Do not invent product names, prices, order details, or cart contents — you don't have access
            to that data in this reply, even if it seems plausible to guess.
            """;

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        for (ChatMessageDto h : history) {
            messages.add(Map.of("role", h.getRole(), "content", h.getContent()));
        }
        messages.add(Map.of("role", "user", "content", message));

        String reply = callGroqText(messages);
        if (reply == null || reply.isBlank()) {
            reply = "I'm here to help you find products, check your orders, browse shops, or see your cart — what would you like to do?";
        }
        return ChatResponse.builder().reply(reply).build();
    }

    // --- Shared helpers -----------------------------------------------------------

    private List<ChatMessageDto> trimHistory(List<ChatMessageDto> history) {
        if (history == null || history.isEmpty()) return List.of();
        int from = Math.max(0, history.size() - 6);
        return history.subList(from, history.size());
    }

    private List<Product> findProducts(String keyword, Double minPrice, Double maxPrice, int limit) {
        List<Product> base = productRepository.findAll().stream()
                .filter(p -> p.getShop().getStatus() == Shop.ShopStatus.APPROVED)
                .filter(p -> minPrice == null || p.getPrice() >= minPrice)
                .filter(p -> maxPrice == null || p.getPrice() <= maxPrice)
                .toList();

        if (keyword == null || keyword.isBlank()) {
            return base.stream().limit(limit).toList();
        }

        String term = keyword.toLowerCase();
        List<Product> exact = base.stream().filter(p -> containsTerm(p, term)).limit(limit).toList();
        if (!exact.isEmpty()) return exact;

        // Broader fallback: if the full phrase matches nothing, try matching on any individual
        // word in it — "affordable phone cases" stripped to "phone cases" still won't substring-match
        // a product literally named "Mobile Phone Cover", but "phone" alone will.
        String[] words = term.split("\\s+");
        if (words.length > 1) {
            return base.stream()
                    .filter(p -> Arrays.stream(words).filter(w -> w.length() >= 3).anyMatch(w -> containsTerm(p, w)))
                    .limit(limit)
                    .toList();
        }
        return List.of();
    }

    private boolean containsTerm(Product p, String term) {
        return (p.getName() != null && p.getName().toLowerCase().contains(term))
                || (p.getDescription() != null && p.getDescription().toLowerCase().contains(term));
    }

    private List<ProductResponse> toProductResponses(List<Product> products) {
        return products.stream()
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

    private JsonNode callGroqJson(String systemPrompt, String userPrompt) throws Exception {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 150,
                "temperature", 0,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        String content = callGroq(requestBody);
        content = content.replaceAll("```json", "").replaceAll("```", "").trim();
        return objectMapper.readTree(content);
    }

    private String callGroqText(List<Map<String, Object>> messages) {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 200,
                "temperature", 0.7,
                "messages", messages
        );
        try {
            return callGroq(requestBody).trim();
        } catch (Exception e) {
            return null;
        }
    }

    private String callGroq(Map<String, Object> requestBody) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("choices").get(0).path("message").path("content").asText();
    }
}