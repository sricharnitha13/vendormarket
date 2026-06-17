package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.*;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.Review;
import com.vendormarket.vendor_marketplace.model.User;
import com.vendormarket.vendor_marketplace.repository.ProductRepository;
import com.vendormarket.vendor_marketplace.repository.ReviewRepository;
import com.vendormarket.vendor_marketplace.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(Long productId) {
        return reviewRepository.findByProductId(productId).stream()
                .map(r -> ReviewResponse.builder()
                        .id(r.getId())
                        .userName(r.getUser().getName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Double getAverageRating(Long productId) {
        return reviewRepository.findAverageRating(productId);
    }

    @Transactional(readOnly = true)
    public Long getReviewCount(Long productId) {
        return reviewRepository.countByProductId(productId);
    }

    @Transactional
    public List<ReviewResponse> addOrUpdateReview(String email, Long productId, ReviewRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        Review review = reviewRepository.findByUserEmailAndProductId(email, productId)
                .orElseGet(Review::new);

        review.setUser(user);
        review.setProduct(product);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        reviewRepository.save(review);

        return getReviews(productId);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(String email, Long productId) {
        return reviewRepository.findByUserEmailAndProductId(email, productId)
                .map(r -> ReviewResponse.builder()
                        .id(r.getId())
                        .userName(r.getUser().getName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .orElse(null);
    }
}