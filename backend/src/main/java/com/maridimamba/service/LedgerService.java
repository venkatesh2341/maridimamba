package com.maridimamba.service;

import com.maridimamba.dto.DeductionCreateRequest;
import com.maridimamba.dto.LedgerTransactionDto;
import com.maridimamba.entity.LedgerTransaction;
import com.maridimamba.entity.MonthlyCycle;
import com.maridimamba.enums.CycleStatus;
import com.maridimamba.enums.ReferenceType;
import com.maridimamba.enums.TransactionType;
import com.maridimamba.exception.BusinessRuleException;
import com.maridimamba.repository.LedgerTransactionRepository;
import com.maridimamba.repository.MonthlyCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LedgerService {

    private final LedgerTransactionRepository ledgerRepository;
    private final MonthlyCycleRepository cycleRepository;
    private final AuditService auditService;

    public BigDecimal getCurrentGroupBalance() {
        return ledgerRepository.findTopByOrderByTransactionDateDescIdDesc()
                .map(LedgerTransaction::getRunningBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public LedgerTransaction recordTransaction(MonthlyCycle cycle,
                                              TransactionType type,
                                              BigDecimal amount,
                                              ReferenceType refType,
                                              Long refId,
                                              String description,
                                              String username) {
        BigDecimal currentBalance = getCurrentGroupBalance();
        BigDecimal newRunningBalance = currentBalance.add(amount);

        LedgerTransaction transaction = LedgerTransaction.builder()
                .cycle(cycle)
                .transactionType(type)
                .amount(amount)
                .runningBalance(newRunningBalance)
                .referenceType(refType)
                .referenceId(refId)
                .description(description)
                .transactionDate(LocalDateTime.now())
                .createdBy(username != null ? username : "system")
                .build();

        LedgerTransaction saved = ledgerRepository.save(transaction);
        log.info("LEDGER: Recorded [{}] amount [{}], previous balance [{}], new balance [{}]",
                type, amount, currentBalance, newRunningBalance);
        return saved;
    }

    @Transactional
    public LedgerTransactionDto recordDeduction(DeductionCreateRequest request, String username) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Deduction amount must be greater than zero");
        }
        if (request.getCause() == null || request.getCause().trim().isEmpty()) {
            throw new BusinessRuleException("Cause or purpose for reducing group balance is required");
        }

        BigDecimal currentBalance = getCurrentGroupBalance();
        if (request.getAmount().compareTo(currentBalance) > 0) {
            throw new BusinessRuleException("Reduction amount (₹" + request.getAmount() +
                    ") exceeds current group liquid balance (₹" + currentBalance + ")");
        }

        MonthlyCycle activeCycle = cycleRepository.findTopByStatusOrderByMonthDateDesc(CycleStatus.OPEN).orElse(null);

        String category = (request.getCategory() != null && !request.getCategory().isBlank())
                ? request.getCategory().trim().toUpperCase()
                : "OTHER_EXPENSE";

        String description = "[" + category + "] " + request.getCause().trim();
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            description += " (" + request.getNotes().trim() + ")";
        }

        String user = (username != null && !username.isBlank()) ? username : "leader";

        LedgerTransaction transaction = recordTransaction(
                activeCycle,
                TransactionType.OTHER_EXPENSE,
                request.getAmount().negate(),
                ReferenceType.MANUAL,
                null,
                description,
                user
        );

        auditService.logAction("LIQUID_BALANCE_DEDUCTION", "LEDGER", transaction.getId().toString(),
                null, "Leader " + user + " reduced group balance by ₹" + request.getAmount() +
                        " for cause: " + request.getCause().trim() + " [Category: " + category + "]");

        return mapToDto(transaction);
    }

    public List<LedgerTransactionDto> getAllTransactions() {
        return ledgerRepository.findAllByOrderByTransactionDateDescIdDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LedgerTransactionDto> getTransactionsForCycle(Long cycleId) {
        return ledgerRepository.findByCycleIdOrderByTransactionDateAscIdAsc(cycleId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LedgerTransactionDto mapToDto(LedgerTransaction entity) {
        return LedgerTransactionDto.builder()
                .id(entity.getId())
                .cycleId(entity.getCycle() != null ? entity.getCycle().getId() : null)
                .cycleName(entity.getCycle() != null ? entity.getCycle().getCycleName() : null)
                .transactionType(entity.getTransactionType())
                .amount(entity.getAmount())
                .runningBalance(entity.getRunningBalance())
                .referenceType(entity.getReferenceType())
                .referenceId(entity.getReferenceId())
                .description(entity.getDescription())
                .transactionDate(entity.getTransactionDate())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
