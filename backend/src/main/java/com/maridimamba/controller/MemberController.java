package com.maridimamba.controller;

import com.maridimamba.dto.MemberCreateRequest;
import com.maridimamba.dto.MemberDetailDto;
import com.maridimamba.dto.MemberDto;
import com.maridimamba.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ResponseEntity<List<MemberDto>> getAllMembers() {
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    @GetMapping("/active")
    public ResponseEntity<List<MemberDto>> getActiveMembers() {
        return ResponseEntity.ok(memberService.getActiveMembers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberDto> getMemberById(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.getMemberById(id));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<MemberDetailDto> getMemberDetails(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.getMemberDetails(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<MemberDto> createMember(@Valid @RequestBody MemberCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.createMember(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<MemberDto> updateMember(@PathVariable Long id, @Valid @RequestBody MemberCreateRequest request) {
        return ResponseEntity.ok(memberService.updateMember(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<MemberDto> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        boolean active = payload.getOrDefault("active", true);
        return ResponseEntity.ok(memberService.toggleMemberStatus(id, active));
    }
}
