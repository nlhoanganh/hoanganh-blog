package com.blog.service;

import com.blog.dto.PagedResponse;
import com.blog.dto.PostResponse;
import com.blog.dto.PostSummaryResponse;
import com.blog.entity.Post;
import com.blog.entity.Tag;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.PostRepository;
import com.blog.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final ImageService imageService;

    @Override
    public PostResponse createPost(String title, String content, String tags, MultipartFile coverImage) {
        String coverImageUrl = imageService.store(coverImage);
        Post post = Post.builder()
                .title(title)
                .content(content)
                .coverImageUrl(coverImageUrl)
                .tags(resolveTags(tags))
                .build();
        return toResponse(postRepository.save(post));
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getPost(Long id) {
        return toResponse(findPost(id));
    }

    @Override
    public PostResponse updatePost(Long id, String title, String content, String tags, MultipartFile coverImage) {
        Post post = findPost(id);
        post.setTitle(title);
        post.setContent(content);
        post.setTags(resolveTags(tags));
        if (coverImage != null && !coverImage.isEmpty()) {
            post.setCoverImageUrl(imageService.store(coverImage));
        }
        return toResponse(postRepository.save(post));
    }

    @Override
    public void deletePost(Long id) {
        postRepository.delete(findPost(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PostSummaryResponse> getPosts(Pageable pageable) {
        Page<Post> page = postRepository.findAll(pageable);
        return PagedResponse.<PostSummaryResponse>builder()
                .content(page.getContent().stream().map(this::toSummary).collect(Collectors.toList()))
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .build();
    }

    // --- Private helpers ---

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
    }

    private Set<Tag> resolveTags(String tagsString) {
        if (tagsString == null || tagsString.isBlank()) return Set.of();
        return Arrays.stream(tagsString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(name -> tagRepository.findByName(name)
                        .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build())))
                .collect(Collectors.toSet());
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .excerpt(generateExcerpt(post.getContent()))
                .coverImageUrl(post.getCoverImageUrl())
                .tags(post.getTags().stream().map(Tag::getName).collect(Collectors.toSet()))
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private PostSummaryResponse toSummary(Post post) {
        return PostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .excerpt(generateExcerpt(post.getContent()))
                .coverImageUrl(post.getCoverImageUrl())
                .tags(post.getTags().stream().map(Tag::getName).collect(Collectors.toSet()))
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private String generateExcerpt(String content) {
        if (content == null) return "";
        String stripped = content
                .replaceAll("#{1,6}\\s+", "")
                .replaceAll("\\*{1,2}(.*?)\\*{1,2}", "$1")
                .replaceAll("\\[(.+?)]\\(.*?\\)", "$1")
                .replaceAll("`{1,3}[^`]*`{1,3}", "")
                .replaceAll("\\n+", " ")
                .trim();
        return stripped.length() > 200 ? stripped.substring(0, 200) + "..." : stripped;
    }
}
