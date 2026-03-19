package com.blog.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class PostSummaryResponse {
    private Long id;
    private String title;
    private String excerpt;
    private String coverImageUrl;
    private Set<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
