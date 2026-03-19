package com.blog.controller;

import com.blog.dto.PagedResponse;
import com.blog.dto.PostResponse;
import com.blog.dto.PostSummaryResponse;
import com.blog.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<PagedResponse<PostSummaryResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(postService.getPosts(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPost(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String tags,
            @RequestParam(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        PostResponse created = postService.createPost(title, content, tags, coverImage);
        return ResponseEntity.created(URI.create("/api/posts/" + created.getId())).body(created);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String tags,
            @RequestParam(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        return ResponseEntity.ok(postService.updatePost(id, title, content, tags, coverImage));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
