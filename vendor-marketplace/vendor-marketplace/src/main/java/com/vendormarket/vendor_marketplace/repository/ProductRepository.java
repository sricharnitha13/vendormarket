package com.vendormarket.vendor_marketplace.repository;

import com.vendormarket.vendor_marketplace.model.Category;
import com.vendormarket.vendor_marketplace.model.Product;
import com.vendormarket.vendor_marketplace.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByShop(Shop shop);
    List<Product> findByShopId(Long shopId);
    long countByCategory(Category category);

    @Query("""
        SELECT p FROM Product p
        WHERE (:keywords IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keywords, '%'))
                                  OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keywords, '%')))
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
        """)
    List<Product> searchWithFilters(
            @Param("keywords") String keywords,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice
    );
}