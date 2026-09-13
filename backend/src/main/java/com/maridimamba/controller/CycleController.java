package com.maridimamba.controller;

import com.maridimamba.dto.*;
import com.maridimamba.service.CycleService;
import com.maridimamba.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cycles")
@RequiredArgsConstructor
public class CycleController {

    private final CycleService cycleService;
    private final LoanService loanService;

    @GetMapping
    public ResponseEntity<List<CycleDto>> getAllCycles() {
        return ResponseEntity.ok(cycleService.getAllCycles());
    }

    @GetMapping("/active")
    public ResponseEntity<CycleDto> getActiveCycle() {
        return cycleService.getActiveCycle()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/available-balance")
    public ResponseEntity<Map<String, BigDecimal>> getAvailableBalance() {
        return ResponseEntity.ok(Map.of("availableBalance", cycleService.getAvailableBalanceForNewCycle()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CycleDto> getCycleById(@PathVariable Long id) {
        return ResponseEntity.ok(cycleService.getCycleById(id));
    }

    @GetMapping("/{id}/loans")
    public ResponseEntity<List<LoanDto>> getCycleLoans(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoansForCycle(id));
    }

    @GetMapping("/{id}/eligible-members")
    public ResponseEntity<List<MemberDto>> getEligibleMembers(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getEligibleMembersForCycle(id));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<CycleSummaryDto> getCycleCloseSummary(@PathVariable Long id) {
        return ResponseEntity.ok(cycleService.getCycleCloseSummary(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<CycleDto> createCycle(@Valid @RequestBody CycleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cycleService.createCycle(request));
    }

    @PostMapping("/{id}/chunks")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<List<LoanDto>> assignChunks(@PathVariable Long id, @Valid @RequestBody ChunkAssignRequest request) {
        return ResponseEntity.ok(loanService.assignChunks(id, request));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<CycleDto> closeCycle(@PathVariable Long id, @RequestBody(required = false) CycleCloseRequest request) {
        if (request == null) {
            request = new CycleCloseRequest();
        }
        return ResponseEntity.ok(cycleService.closeCycle(id, request));
    }
}
