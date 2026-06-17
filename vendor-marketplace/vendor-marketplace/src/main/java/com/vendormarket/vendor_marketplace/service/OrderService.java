package com.vendormarket.vendor_marketplace.service;

import com.vendormarket.vendor_marketplace.dto.*;
import com.vendormarket.vendor_marketplace.model.*;
import com.vendormarket.vendor_marketplace.model.Notification.NotificationType;
import com.vendormarket.vendor_marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.util.TreeMap;
import com.vendormarket.vendor_marketplace.model.Coupon;
import com.vendormarket.vendor_marketplace.model.DiscountType;
import com.vendormarket.vendor_marketplace.repository.CouponRepository;
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final NotificationService notificationService;
    @Transactional
    public OrderResponse placeOrder(String email, PlaceOrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Your cart is empty — add items before placing an order"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        List<CartItem> itemsToOrder;
        if (request.getCartItemIds() == null || request.getCartItemIds().isEmpty()) {
            itemsToOrder = cart.getItems();
        } else {
            itemsToOrder = cart.getItems().stream()
                    .filter(ci -> request.getCartItemIds().contains(ci.getId()))
                    .collect(Collectors.toList());

            if (itemsToOrder.isEmpty()) {
                throw new RuntimeException("None of the specified cart items found");
            }
        }

        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PLACED);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setPaymentMethod(request.getPaymentMethod());

        List<OrderItem> orderItems = itemsToOrder.stream().map(ci -> {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(ci.getProduct());
            oi.setQuantity(ci.getQuantity());
            oi.setPriceAtPurchase(ci.getProduct().getPrice());
            return oi;
        }).collect(Collectors.toList());

        order.setItems(orderItems);

        // Validate stock availability before placing the order
        for (OrderItem oi : orderItems) {
            if (oi.getProduct().getStock() < oi.getQuantity()) {
                throw new RuntimeException("Insufficient stock for " + oi.getProduct().getName());
            }
        }

        double subtotal = orderItems.stream()
                .mapToDouble(oi -> oi.getPriceAtPurchase() * oi.getQuantity())
                .sum();

        double discountAmount = 0.0;
        String appliedCouponCode = null;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode().trim())
                    .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

            if (!coupon.isActive()) {
                throw new RuntimeException("This coupon is no longer active");
            }
            if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("This coupon has expired");
            }

            double shopSubtotal = orderItems.stream()
                    .filter(oi -> oi.getProduct().getShop().getId().equals(coupon.getShop().getId()))
                    .mapToDouble(oi -> oi.getPriceAtPurchase() * oi.getQuantity())
                    .sum();

            if (shopSubtotal <= 0) {
                throw new RuntimeException("This coupon is not applicable to items in your order");
            }
            if (coupon.getMinOrderAmount() != null && shopSubtotal < coupon.getMinOrderAmount()) {
                throw new RuntimeException("Minimum order of ₹" + coupon.getMinOrderAmount()
                        + " from " + coupon.getShop().getName() + " required for this coupon");
            }

            if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
                discountAmount = shopSubtotal * (coupon.getDiscountValue() / 100.0);
                if (coupon.getMaxDiscountAmount() != null) {
                    discountAmount = Math.min(discountAmount, coupon.getMaxDiscountAmount());
                }
            } else {
                discountAmount = Math.min(coupon.getDiscountValue(), shopSubtotal);
            }
            appliedCouponCode = coupon.getCode();
        }

        order.setDiscountAmount(discountAmount);
        order.setCouponCode(appliedCouponCode);
        order.setTotalAmount(subtotal - discountAmount);

        // Mock Payment Handling
        if (request.getPaymentMethod() == PaymentMethod.ONLINE) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setMockPaymentId("MOCK_PAY_" + System.currentTimeMillis());
        } else {
            order.setPaymentStatus(PaymentStatus.PENDING); // COD - paid on delivery
        }

        orderRepository.save(order);

        // Decrement stock for each ordered item
        for (OrderItem oi : orderItems) {
            Product product = oi.getProduct();
            product.setStock(product.getStock() - oi.getQuantity());
            productRepository.save(product);
        }

        cart.getItems().removeAll(itemsToOrder);
        cartRepository.save(cart);

        return mapToResponse(order);
    }

    public List<OrderResponse> getVendorOrders(String email) {
        User vendor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return orderRepository.findAll().stream()
                .filter(order -> order.getItems().stream()
                        .anyMatch(item -> item.getProduct().getShop().getOwner().getId()
                                .equals(vendor.getId())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getMyOrders(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(String email, Long orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(OrderStatus.valueOf(newStatus.toUpperCase()));
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        notificationService.notify(
                saved.getUser(),
                NotificationType.ORDER_STATUS_CHANGED,
                "Order update",
                "Your order #" + saved.getId() + " is now " + saved.getStatus().name().toLowerCase() + ".",
                "ORDER",
                saved.getId()
        );

        return mapToResponse(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel an order that is already shipped or delivered");
        }

        // Restore stock for each item
        for (OrderItem oi : order.getItems()) {
            Product product = oi.getProduct();
            product.setStock(product.getStock() + oi.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        return mapToResponse(order);
    }

    public VendorDashboardResponse getVendorDashboard(String email) {
        User vendor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Order> allOrders = orderRepository.findAll();

        double totalRevenue = 0;
        long totalOrders = 0;
        long pendingOrders = 0;

        Map<Long, String> productNames = new HashMap<>();
        Map<Long, Long> quantitySold = new HashMap<>();
        Map<Long, Double> productRevenue = new HashMap<>();

        for (Order order : allOrders) {
            boolean hasVendorItem = false;
            for (OrderItem item : order.getItems()) {
                if (item.getProduct().getShop().getOwner().getId().equals(vendor.getId())) {
                    hasVendorItem = true;
                    if (order.getStatus() != OrderStatus.CANCELLED) {
                        double subtotal = item.getPriceAtPurchase() * item.getQuantity();
                        totalRevenue += subtotal;
                        Long productId = item.getProduct().getId();
                        productNames.put(productId, item.getProduct().getName());
                        quantitySold.merge(productId, (long) item.getQuantity(), Long::sum);
                        productRevenue.merge(productId, subtotal, Double::sum);
                    }
                }
            }
            if (hasVendorItem) {
                totalOrders++;
                if (order.getStatus() == OrderStatus.PLACED || order.getStatus() == OrderStatus.PROCESSING) {
                    pendingOrders++;
                }
            }
        }

        List<VendorDashboardResponse.TopProduct> topProducts = quantitySold.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> VendorDashboardResponse.TopProduct.builder()
                        .productId(e.getKey())
                        .productName(productNames.get(e.getKey()))
                        .quantitySold(e.getValue())
                        .revenue(productRevenue.get(e.getKey()))
                        .build())
                .collect(Collectors.toList());

        return VendorDashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .topProducts(topProducts)
                .build();
    }

    private OrderResponse mapToResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setStatus(order.getStatus());
        res.setTotalAmount(order.getTotalAmount());
        res.setPaymentMethod(order.getPaymentMethod());
        res.setPaymentStatus(order.getPaymentStatus());
        res.setCreatedAt(order.getCreatedAt());
        res.setUpdatedAt(order.getUpdatedAt());
        res.setSubtotal(order.getTotalAmount() + (order.getDiscountAmount() != null ? order.getDiscountAmount() : 0));
        res.setDiscountAmount(order.getDiscountAmount());
        res.setCouponCode(order.getCouponCode());

        List<OrderItemResponse> itemResponses = order.getItems().stream().map(oi -> {
            OrderItemResponse ir = new OrderItemResponse();
            ir.setId(oi.getId());
            ir.setProductId(oi.getProduct().getId());
            ir.setProductName(oi.getProduct().getName());
            ir.setQuantity(oi.getQuantity());
            ir.setPriceAtPurchase(oi.getPriceAtPurchase());
            ir.setSubtotal(oi.getPriceAtPurchase() * oi.getQuantity());
            return ir;
        }).collect(Collectors.toList());

        res.setItems(itemResponses);
        return res;
    }
    public List<RevenueDataPoint> getVendorRevenueOverTime(String email, int days) {
        User vendor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate startDate = LocalDate.now().minusDays(days - 1);

        Map<LocalDate, Double> revenueByDate = new TreeMap<>();
        Map<LocalDate, Long> ordersByDate = new TreeMap<>();

        // Initialize all dates in range with 0
        for (int i = 0; i < days; i++) {
            LocalDate d = startDate.plusDays(i);
            revenueByDate.put(d, 0.0);
            ordersByDate.put(d, 0L);
        }

        List<Order> allOrders = orderRepository.findAll();

        for (Order order : allOrders) {
            if (order.getStatus() == OrderStatus.CANCELLED) continue;

            LocalDate orderDate = order.getCreatedAt().toLocalDate();
            if (orderDate.isBefore(startDate)) continue;

            boolean hasVendorItem = false;
            double vendorRevenue = 0;

            for (OrderItem item : order.getItems()) {
                if (item.getProduct().getShop().getOwner().getId().equals(vendor.getId())) {
                    hasVendorItem = true;
                    vendorRevenue += item.getPriceAtPurchase() * item.getQuantity();
                }
            }

            if (hasVendorItem) {
                revenueByDate.merge(orderDate, vendorRevenue, Double::sum);
                ordersByDate.merge(orderDate, 1L, Long::sum);
            }
        }

        return revenueByDate.entrySet().stream()
                .map(e -> RevenueDataPoint.builder()
                        .date(e.getKey().toString())
                        .revenue(e.getValue())
                        .orders(ordersByDate.get(e.getKey()))
                        .build())
                .collect(Collectors.toList());
    }
}