package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.WishlistItemResponse;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.model.WishlistItem;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import com.vendormarket.vendor_marketplace.repository.WishlistRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getWishlist(String email) {
        return wishlistRepository.findByUserEmail(email).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<WishlistItemResponse> addToWishlist(String email, Long productId) {
        if (wishlistRepository.existsByUserEmailAndProductId(email, productId)) {
            return getWishlist(email);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        WishlistItem item = new WishlistItem();
        item.setUser(user);
        item.setProduct(product);
        wishlistRepository.save(item);

        return getWishlist(email);
    }

    @Transactional
    public List<WishlistItemResponse> removeFromWishlist(String email, Long productId) {
        wishlistRepository.deleteByUserEmailAndProductId(email, productId);
        return getWishlist(email);
    }

    private WishlistItemResponse toResponse(WishlistItem item) {
        Product p = item.getProduct();
        return WishlistItemResponse.builder()
                .id(item.getId())
                .productId(p.getId())
                .productName(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .stock(p.getStock())
                .imageUrl(p.getImageUrl())
                .addedAt(item.getAddedAt())
                .build();
    }
}