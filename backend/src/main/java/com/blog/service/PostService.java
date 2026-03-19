package com.blog.service;

import com.blog.dto.PagedResponse;
import com.blog.dto.PostResponse;
import com.blog.dto.PostSummaryResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface PostService {
    PostResponse createPost(String title, String content, String tags, MultipartFile coverImage);
    PostResponse getPost(Long id);
    PostResponse updatePost(Long id, String title, String content, String tags, MultipartFile coverImage);
    void deletePost(Long id);
    PagedResponse<PostSummaryResponse> getPosts(Pageable pageable);
}
