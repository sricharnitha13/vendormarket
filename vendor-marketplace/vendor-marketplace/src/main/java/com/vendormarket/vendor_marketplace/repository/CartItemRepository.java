package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Cart;
import com.vendormarket.vendor_marketplace.model.CartItem;
import com.vendormarket.vendor_marketplace.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
}