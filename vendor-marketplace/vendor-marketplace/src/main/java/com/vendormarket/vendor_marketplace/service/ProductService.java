package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.BulkUploadResponse;
import com.vendormarket.vendor_marketplace.dto.ProductDetailResponse;
import com.vendormarket.vendor_marketplace.dto.ProductRequest;
import com.vendormarket.vendor_marketplace.dto.ProductResponse;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.Shop;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import com.vendormarket.vendor_marketplace.repository.ShopRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ReviewService reviewService;

    public ProductResponse createProduct(ProductRequest request) {
        Shop shop = getAndValidateShop(request.getShopId());
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .shop(shop)
                .isActive(true)
                .build();
        return toResponse(productRepository.save(product));
    }

    public List<ProductResponse> getProductsByShop(Long shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        return productRepository.findByShopAndIsActiveTrue(shop)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return toResponse(product);
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        validateOwnership(product.getShop());

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        return toResponse(productRepository.save(product));
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        validateOwnership(product.getShop());
        // Soft delete: mark inactive to preserve FK references in carts/orders
        product.setIsActive(false);
        productRepository.save(product);
    }
    public List<ProductResponse> searchProducts(String keyword, Double minPrice, Double maxPrice) {
        return productRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> keyword == null || keyword.isBlank() ||
                        p.getName().toLowerCase().contains(keyword.toLowerCase()) ||
                        (p.getDescription() != null && p.getDescription().toLowerCase().contains(keyword.toLowerCase())))
                .filter(p -> minPrice == null || p.getPrice() >= minPrice)
                .filter(p -> maxPrice == null || p.getPrice() <= maxPrice)
                .filter(p -> p.getShop().getStatus() == Shop.ShopStatus.APPROVED)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    public ProductDetailResponse getProductDetail(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));


        return ProductDetailResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .stock(p.getStock())
                .imageUrl(p.getImageUrl())
                .shopId(p.getShop() != null ? p.getShop().getId() : null)
                .shopName(p.getShop() != null ? p.getShop().getName() : null)
                .createdAt(p.getCreatedAt())
                .averageRating(reviewService.getAverageRating(id))
                .reviewCount(reviewService.getReviewCount(id))
                .reviews(reviewService.getReviews(id))
                .build();
    }
    private Shop getAndValidateShop(Long shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found"));
        if (shop.getStatus() != Shop.ShopStatus.APPROVED) {
            throw new RuntimeException("Shop is not approved yet");
        }
        validateOwnership(shop);
        return shop;
    }

    private void validateOwnership(Shop shop) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!shop.getOwner().getEmail().equals(email)) {
            throw new RuntimeException("You do not own this shop");
        }
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .shopId(product.getShop().getId())
                .shopName(product.getShop().getName())
                .createdAt(product.getCreatedAt())
                .build();
    }
    public BulkUploadResponse bulkCreateProducts(List<ProductRequest> requests) {
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            ProductRequest req = requests.get(i);
            try {
                if (req.getName() == null || req.getName().isBlank()) {
                    throw new RuntimeException("Product name is required");
                }
                if (req.getPrice() == null || req.getPrice() <= 0) {
                    throw new RuntimeException("Price must be positive");
                }
                if (req.getStock() == null || req.getStock() < 0) {
                    throw new RuntimeException("Stock cannot be negative");
                }
                // Skip duplicates: check if a product with the same name already exists in this shop
                if (req.getShopId() != null &&
                        productRepository.existsByNameAndShopIdAndIsActiveTrue(req.getName(), req.getShopId())) {
                    errors.add("Row " + (i + 2) + " (" + req.getName() + "): Skipped — product already exists in this shop");
                    continue;
                }
                createProduct(req);
                successCount++;
            } catch (Exception e) {
                errors.add("Row " + (i + 2) + " (" +
                        (req.getName() != null && !req.getName().isBlank() ? req.getName() : "unnamed") + "): " + e.getMessage());
            }
        }

        return BulkUploadResponse.builder()
                .totalRows(requests.size())
                .successCount(successCount)
                .errors(errors)
                .build();
    }
}