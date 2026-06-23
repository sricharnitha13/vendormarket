package com.vendormarket.vendor_marketplace.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChatRequest {
    private String message;
    private List<ChatMessageDto> history; // recent turns only, frontend trims this
}