package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Order;
import com.vendormarket.vendor_marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.vendormarket.vendor_marketplace.model.User;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    @Query("select distinct o.user from Order o join o.items oi where oi.product.shop.id = :shopId")
    List<User> findDistinctCustomersByShopId(@Param("shopId") Long shopId);

}