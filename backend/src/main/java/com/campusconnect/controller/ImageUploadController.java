
package com.campusconnect.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(origins = "http://localhost:5173")
public class ImageUploadController {

    private final Cloudinary cloudinary;

    public ImageUploadController(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @PostMapping(
            value = "/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("image") MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select an image."
            );
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image must be 5 MB or smaller."
            );
        }

        String contentType = image.getContentType();

        if (contentType == null ||
                !(contentType.equals("image/jpeg") ||
                  contentType.equals("image/png") ||
                  contentType.equals("image/webp"))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPG, PNG, and WEBP images are allowed."
            );
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    image.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "campusconnect/issues",
                            "resource_type", "image"
                    )
            );

            String imageUrl = (String) result.get("secure_url");

            return ResponseEntity.ok(
                    Map.of("imageUrl", imageUrl)
            );

        } catch (Exception e) {
    e.printStackTrace();
    return ResponseEntity.status(502)
            .body(Map.of("error", e.toString()));
}
    }
}