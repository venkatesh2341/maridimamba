package com.maridimamba.dto;

import com.maridimamba.enums.CycleStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CycleDto {
    private Long id;
    private String cycleName;
    private LocalDate monthDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal openingBalance;
    private BigDecimal lendingAmount;
    private BigDecimal reserveAmount;
    private BigDecimal chunkAmount;
    private String chunkBreakdown;
    private Integer numberOfChunks;
    private BigDecimal closingBalance;
    private CycleStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime closedAt;

    // Financial metrics for this cycle
    private BigDecimal totalLent;
    private BigDecimal expectedRepayment;
    private BigDecimal expectedInterest;
    private BigDecimal actualRepaymentReceived;
    private BigDecimal actualInterestReceived;
    private BigDecimal outstandingAmount;
    private long totalLoans;
    private long paidLoans;
    private long pendingLoans;
}
