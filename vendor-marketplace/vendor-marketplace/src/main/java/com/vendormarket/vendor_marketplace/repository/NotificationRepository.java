package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Notification;
import com.vendormarket.vendor_marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndReadFalse(User recipient);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipient = :recipient and n.read = false")
    void markAllAsReadForRecipient(@Param("recipient") User recipient);
}