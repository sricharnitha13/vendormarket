package com.vendormarket.vendor_marketplace.dto;

public class AiSearchCriteria {
    private String keywords;
    private String category;
    private Double minPrice;
    private Double maxPrice;

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
}