package com.maridimamba.controller;

import com.maridimamba.dto.DeductionCreateRequest;
import com.maridimamba.dto.LedgerTransactionDto;
import com.maridimamba.service.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<List<LedgerTransactionDto>> getAllLedgerTransactions() {
        return ResponseEntity.ok(ledgerService.getAllTransactions());
    }

    @GetMapping("/cycle/{cycleId}")
    public ResponseEntity<List<LedgerTransactionDto>> getTransactionsForCycle(@PathVariable Long cycleId) {
        return ResponseEntity.ok(ledgerService.getTransactionsForCycle(cycleId));
    }

    @PostMapping("/deduction")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<LedgerTransactionDto> recordDeduction(
            @Valid @RequestBody DeductionCreateRequest request,
            Authentication auth) {
        String username = (auth != null) ? auth.getName() : "leader";
        LedgerTransactionDto created = ledgerService.recordDeduction(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
