package com.campusconnect.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/")
    public String home() {
        return "CampusConnect Backend is Running Successfully!";
    }

    @GetMapping("/api/test")
    public String test() {
        return "CampusConnect API is Working!";
    }
}