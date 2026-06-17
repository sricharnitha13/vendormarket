package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Cart;
import com.vendormarket.vendor_marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(User user);
}