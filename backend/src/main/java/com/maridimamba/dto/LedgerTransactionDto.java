package com.maridimamba.dto;

import com.maridimamba.enums.ReferenceType;
import com.maridimamba.enums.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerTransactionDto {
    private Long id;
    private Long cycleId;
    private String cycleName;
    private TransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal runningBalance;
    private ReferenceType referenceType;
    private Long referenceId;
    private String description;
    private LocalDateTime transactionDate;
    private String createdBy;
    private LocalDateTime createdAt;
}
