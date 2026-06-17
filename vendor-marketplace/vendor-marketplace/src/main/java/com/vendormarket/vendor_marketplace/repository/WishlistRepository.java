package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    @Query("SELECT w FROM WishlistItem w JOIN FETCH w.product p LEFT JOIN FETCH p.shop WHERE w.user.email = :email ORDER BY w.addedAt DESC")
    List<WishlistItem> findByUserEmail(@Param("email") String email);

    Optional<WishlistItem> findByUserEmailAndProductId(String email, Long productId);

    boolean existsByUserEmailAndProductId(String email, Long productId);

    void deleteByUserEmailAndProductId(String email, Long productId);
}