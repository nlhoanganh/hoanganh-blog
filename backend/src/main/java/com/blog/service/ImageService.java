package com.blog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Persists a multipart file to the upload directory with a UUID filename.
     *
     * @return the server-relative URL (e.g. "/uploads/abc123.jpg"), or null if no file
     */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        String originalFilename = file.getOriginalFilename();
        String extension = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";

        String filename = UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir);

        try {
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), uploadPath.resolve(filename));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image: " + e.getMessage(), e);
        }

        return "/uploads/" + filename;
    }
}
