package com.maridimamba.controller;

import com.maridimamba.dto.LoanDto;
import com.maridimamba.dto.PaymentCreateRequest;
import com.maridimamba.dto.PaymentDto;
import com.maridimamba.enums.LoanStatus;
import com.maridimamba.service.LoanService;
import com.maridimamba.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;
    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<LoanDto>> getAllLoans(@RequestParam(required = false) LoanStatus status) {
        return ResponseEntity.ok(loanService.getAllLoans(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanDto> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanById(id));
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<PaymentDto>> getLoanPayments(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentsForLoan(id));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasRole('LEADER')")
    public ResponseEntity<PaymentDto> recordPayment(@PathVariable Long id, @Valid @RequestBody PaymentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordPayment(id, request));
    }
}
